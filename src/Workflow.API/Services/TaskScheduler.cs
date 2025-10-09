namespace Workflow.API.Services;

public class TaskScheduler : ITaskScheduler, IHostedService
{
    private readonly ILogger<TaskScheduler> _logger;
    private readonly INodeExecutor _nodeExecutor;
    private readonly List<WorkflowTask> _scheduledTasks = [];
    private readonly Dictionary<string, TaskState> _taskStates = [];
    private readonly Dictionary<string, DateTime> _nextRunTimes = [];
    private readonly Lock _lock = new();
    private Timer? _schedulerTimer;
    private bool _isRunning = false;

    public TaskScheduler(ILogger<TaskScheduler> logger, INodeExecutor nodeExecutor)
    {
        _logger = logger;
        _nodeExecutor = nodeExecutor;
    }

    public Task StartAsync(CancellationToken cancellationToken = default)
    {
        using (_lock.EnterScope())
        {
            if (!_isRunning)
            {
                _isRunning = true;
                _schedulerTimer = new Timer(CheckScheduledTasks, null, TimeSpan.Zero, TimeSpan.FromSeconds(1));
                _logger.LogInformation("Task scheduler started");
            }
        }
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        using (_lock.EnterScope())
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

    public Task ScheduleTaskAsync(WorkflowTask task)
    {
        using (_lock.EnterScope())
        {
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

    public Task<bool> CancelTaskAsync(string taskId)
    {
        using (_lock.EnterScope())
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

    public Task<TaskState> GetTaskStateAsync(string taskId)
    {
        using (_lock.EnterScope())
        {
            if (_taskStates.TryGetValue(taskId, out var state))
            {
                return Task.FromResult(state);
            }
        }
        return Task.FromResult(TaskState.None);
    }
    public Task<IEnumerable<WorkflowTask>> GetPendingTasksAsync()
    {
        using (_lock.EnterScope())
        {
            var pendingTasks = _scheduledTasks
                .Where(t => _taskStates[t.Id] == TaskState.Scheduled || _taskStates[t.Id] == TaskState.Queued)
                .ToList();
            return Task.FromResult(pendingTasks.AsEnumerable());
        }
    }

    public Task<IEnumerable<WorkflowTask>> GetRunningTasksAsync()
    {
        using (_lock.EnterScope())
        {
            var runningTasks = _scheduledTasks
                .Where(t => _taskStates[t.Id] == TaskState.Running)
                .ToList();
            return Task.FromResult(runningTasks.AsEnumerable());
        }
    }

    public Task<bool> AreDependenciesMetAsync(WorkflowTask task)
    {
        foreach (var dependencyId in task.Dependencies)
        {
            if (!_taskStates.TryGetValue(dependencyId, out var state) || state != TaskState.Success)
            {
                return Task.FromResult(false);
            }
        }
        return Task.FromResult(true);
    }

    private async void CheckScheduledTasks(object? state)
    {
        try
        {
            List<WorkflowTask> tasksToExecute = [];

            using (_lock.EnterScope())
            {
                if (!_isRunning) return;

                tasksToExecute = _scheduledTasks
                    .Where(t => _taskStates[t.Id] == TaskState.Scheduled &&
                               _nextRunTimes.TryGetValue(t.Id, out var nextRunTime) &&
                               DateTime.UtcNow >= nextRunTime &&
                               AreDependenciesMetAsync(t).Result)
                    .ToList();
            }

            var executeTasks = tasksToExecute.Select(ExecuteTaskAsync).ToArray();
            await Task.WhenAll(executeTasks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking scheduled tasks");
        }
    }

    private async Task ExecuteTaskAsync(WorkflowTask task)
    {
        try
        {
            using (_lock.EnterScope())
            {
                _taskStates[task.Id] = TaskState.Running;
            }

            _logger.LogInformation("Executing task {TaskId} ({TaskName})", task.Id, task.Name);
            task.StartTime = DateTime.UtcNow;

            var result = await _nodeExecutor.ExecuteNodeAsync(task.Type, null);

            using (_lock.EnterScope())
            {
                task.EndTime = DateTime.UtcNow;
                _taskStates[task.Id] = TaskState.Success;
                _logger.LogInformation("Task {TaskId} executed successfully", task.Id);
            }
        }
        catch (Exception ex)
        {
            lock (_lock)
            {
                task.EndTime = DateTime.UtcNow;
                _taskStates[task.Id] = TaskState.Failed;
                _logger.LogError(ex, "Error executing task {TaskId}", task.Id);
                
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
