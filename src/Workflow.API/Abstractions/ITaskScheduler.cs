namespace Workflow.API.Abstractions;

public interface ITaskScheduler
{
    Task StartAsync(CancellationToken cancellationToken = default);
    Task StopAsync();
    Task ScheduleTaskAsync(WorkflowTask task);
    Task<bool> CancelTaskAsync(string taskId);
    Task<TaskState> GetTaskStateAsync(string taskId);
    Task<IEnumerable<WorkflowTask>> GetPendingTasksAsync();
    Task<IEnumerable<WorkflowTask>> GetRunningTasksAsync();
    Task<bool> AreDependenciesMetAsync(WorkflowTask task);
}