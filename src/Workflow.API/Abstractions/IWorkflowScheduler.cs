namespace Workflow.API.Abstractions;

public interface IWorkflowScheduler
{
    Task<string> ScheduleWorkflowAsync(WorkflowModel workflow);
    Task<bool> CancelWorkflowAsync(string workflowInstanceId);
    Task<IEnumerable<string>> GetRunningWorkflowsAsync();
    Task<IEnumerable<ExecutionLog>> GetExecutionLogsAsync();
    Task<IEnumerable<ExecutionLog>> GetWorkflowExecutionLogsAsync(string workflowInstanceId);
    Task LogExecutionAsync(ExecutionLog log);
    Task<string> ScheduleTaskAsync(WorkflowTask task, string workflowId);
    Task<bool> CancelTaskAsync(string taskInstanceId);
    Task<TaskInstance?> GetTaskInstanceAsync(string taskId, string workflowInstanceId);
    Task<IEnumerable<TaskInstance>> GetTaskInstancesAsync(string workflowInstanceId);
    Task UpdateTaskInstanceStateAsync(string taskInstanceId, TaskState state, string? resultData = null, string? log = null);
}