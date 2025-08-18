using Workflow.API.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Workflow.API.Services;

/// <summary>
/// 任务调度器实现，参考Apache Airflow调度器的设计
/// </summary>
public class TaskScheduler : ITaskScheduler, IHostedService
{
    private readonly ILogger<TaskScheduler> _logger;
    private readonly INodeExecutor _nodeExecutor;
    private readonly List<WorkflowTask> _scheduledTasks = new();
    private readonly Dictionary<string, TaskState> _taskStates = new();
    private readonly Dictionary<string, DateTime> _nextRunTimes = new();
    private readonly object _lockObject = new object();
    private System.Threading.Timer? _schedulerTimer;
    private bool _isRunning = false;

    public TaskScheduler(ILogger<TaskScheduler> logger, INodeExecutor nodeExecutor)
    {
        _logger = logger;
        _nodeExecutor = nodeExecutor;
    }

    /// <summary>
    /// 启动调度器
    /// </summary>
    public Task StartAsync(CancellationToken cancellationToken = default)
    {
        lock (_lockObject)
        {
            if (!_isRunning)
            {
                _isRunning = true;
                // 每秒检查一次待处理的任务
                _schedulerTimer = new System.Threading.Timer(CheckScheduledTasks, null, TimeSpan.Zero, TimeSpan.FromSeconds(1));
                _logger.LogInformation("Task scheduler started");
            }
        }
        return Task.CompletedTask;
    }

    /// <summary>
    /// 停止调度器
    /// </summary>
    public Task StopAsync(CancellationToken cancellationToken)
    {
        lock (_lockObject)
        {
            if (_isRunning)
            {
                _isRunning = false;
                _schedulerTimer?.Dispose();
                _schedulerTimer = null;
                _logger.LogInformation("Task scheduler stopped");
            }
        }
        return Task.CompletedTask;
    }

    /// <summary>
    /// 添加任务到调度队列
    /// </summary>
    public Task ScheduleTaskAsync(WorkflowTask task)
    {
        lock (_lockObject)
        {
            // 如果任务尚未调度，则添加到调度队列
            if (!_scheduledTasks.Any(t => t.Id == task.Id))
            {
                _scheduledTasks.Add(task);
                _taskStates[task.Id] = TaskState.Scheduled;
                _nextRunTimes[task.Id] = DateTime.UtcNow;
                _logger.LogInformation("Task {TaskId} scheduled", task.Id);
            }
        }
        return Task.CompletedTask;
    }

    /// <summary>
    /// 取消任务执行
    /// </summary>
    public Task<bool> CancelTaskAsync(string taskId)
    {
        lock (_lockObject)
        {
            var task = _scheduledTasks.FirstOrDefault(t => t.Id == taskId);
            if (task != null)
            {
                _scheduledTasks.Remove(task);
                _taskStates[taskId] = TaskState.None;
                _nextRunTimes.Remove(taskId);
                _logger.LogInformation("Task {TaskId} cancelled", taskId);
                return Task.FromResult(true);
            }
        }
        return Task.FromResult(false);
    }

    /// <summary>
    /// 获取任务状态
    /// </summary>
    public Task<TaskState> GetTaskStateAsync(string taskId)
    {
        lock (_lockObject)
        {
            if (_taskStates.TryGetValue(taskId, out var state))
            {
                return Task.FromResult(state);
            }
        }
        return Task.FromResult(TaskState.None);
    }

    /// <summary>
    /// 获取所有待处理的任务
    /// </summary>
    public Task<IEnumerable<WorkflowTask>> GetPendingTasksAsync()
    {
        lock (_lockObject)
        {
            var pendingTasks = _scheduledTasks
                .Where(t => _taskStates[t.Id] == TaskState.Scheduled || _taskStates[t.Id] == TaskState.Queued)
                .ToList();
            return Task.FromResult(pendingTasks.AsEnumerable());
        }
    }

    /// <summary>
    /// 获取正在运行的任务
    /// </summary>
    public Task<IEnumerable<WorkflowTask>> GetRunningTasksAsync()
    {
        lock (_lockObject)
        {
            var runningTasks = _scheduledTasks
                .Where(t => _taskStates[t.Id] == TaskState.Running)
                .ToList();
            return Task.FromResult(runningTasks.AsEnumerable());
        }
    }

    /// <summary>
    /// 处理任务依赖关系
    /// </summary>
    public Task<bool> AreDependenciesMetAsync(WorkflowTask task)
    {
        // 检查所有依赖的任务是否都已成功完成
        foreach (var dependencyId in task.Dependencies)
        {
            if (!_taskStates.TryGetValue(dependencyId, out var state) || state != TaskState.Success)
            {
                return Task.FromResult(false);
            }
        }
        return Task.FromResult(true);
    }

    /// <summary>
    /// 定时检查并执行待处理的任务
    /// </summary>
    private async void CheckScheduledTasks(object? state)
    {
        try
        {
            List<WorkflowTask> tasksToExecute = new();
            
            lock (_lockObject)
            {
                if (!_isRunning) return;

                // 获取所有可以执行的任务（依赖已满足且到达执行时间）
                tasksToExecute = _scheduledTasks
                    .Where(t => _taskStates[t.Id] == TaskState.Scheduled &&
                               _nextRunTimes.TryGetValue(t.Id, out var nextRunTime) &&
                               DateTime.UtcNow >= nextRunTime &&
                               AreDependenciesMetAsync(t).Result)
                    .ToList();
            }

            // 并行执行所有可执行的任务
            var executeTasks = tasksToExecute.Select(ExecuteTaskAsync).ToArray();
            await System.Threading.Tasks.Task.WhenAll(executeTasks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking scheduled tasks");
        }
    }

    /// <summary>
    /// 执行单个任务
    /// </summary>
    private async Task ExecuteTaskAsync(WorkflowTask task)
    {
        try
        {
            lock (_lockObject)
            {
                // 更新任务状态为运行中
                _taskStates[task.Id] = TaskState.Running;
            }

            _logger.LogInformation("Executing task {TaskId} ({TaskName})", task.Id, task.Name);
            task.StartTime = DateTime.UtcNow;

            // 执行任务
            var result = await _nodeExecutor.ExecuteNodeAsync(task.Type, null);

            lock (_lockObject)
            {
                // 更新任务状态为成功
                task.EndTime = DateTime.UtcNow;
                _taskStates[task.Id] = TaskState.Success;
                _logger.LogInformation("Task {TaskId} executed successfully", task.Id);
            }
        }
        catch (Exception ex)
        {
            lock (_lockObject)
            {
                // 更新任务状态为失败
                task.EndTime = DateTime.UtcNow;
                _taskStates[task.Id] = TaskState.Failed;
                _logger.LogError(ex, "Error executing task {TaskId}", task.Id);
                
                // 检查是否需要重试
                if (task.TryNumber < task.MaxRetries)
                {
                    task.TryNumber++;
                    _taskStates[task.Id] = TaskState.Retry;
                    _nextRunTimes[task.Id] = DateTime.UtcNow.AddSeconds(task.RetryDelaySeconds);
                    _logger.LogInformation("Task {TaskId} will retry in {Seconds} seconds", task.Id, task.RetryDelaySeconds);
                }
            }
        }
    }

    public Task StopAsync()
    {
        throw new NotImplementedException();
    }
}