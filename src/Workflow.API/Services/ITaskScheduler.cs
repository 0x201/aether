using Workflow.API.Models;
using System.Threading.Tasks;

namespace Workflow.API.Services;

/// <summary>
/// 任务调度器接口，参考Apache Airflow调度器的设计
/// </summary>
public interface ITaskScheduler
{
    /// <summary>
    /// 启动调度器
    /// </summary>
    System.Threading.Tasks.Task StartAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 停止调度器
    /// </summary>
    System.Threading.Tasks.Task StopAsync();

    /// <summary>
    /// 添加任务到调度队列
    /// </summary>
    System.Threading.Tasks.Task ScheduleTaskAsync(WorkflowTask task);

    /// <summary>
    /// 取消任务执行
    /// </summary>
    System.Threading.Tasks.Task<bool> CancelTaskAsync(string taskId);

    /// <summary>
    /// 获取任务状态
    /// </summary>
    System.Threading.Tasks.Task<TaskState> GetTaskStateAsync(string taskId);

    /// <summary>
    /// 获取所有待处理的任务
    /// </summary>
    System.Threading.Tasks.Task<IEnumerable<WorkflowTask>> GetPendingTasksAsync();

    /// <summary>
    /// 获取正在运行的任务
    /// </summary>
    System.Threading.Tasks.Task<IEnumerable<WorkflowTask>> GetRunningTasksAsync();

    /// <summary>
    /// 处理任务依赖关系
    /// </summary>
    System.Threading.Tasks.Task<bool> AreDependenciesMetAsync(WorkflowTask task);
}