using Workflow.API.Models;
using System.Threading.Tasks;

namespace Workflow.API.Services;

public interface IWorkflowScheduler
{
    Task<string> ScheduleWorkflowAsync(WorkflowModel workflow);
    Task<bool> CancelWorkflowAsync(string workflowInstanceId);
    Task<IEnumerable<string>> GetRunningWorkflowsAsync();
    
    // 添加日志相关方法
    Task<IEnumerable<ExecutionLog>> GetExecutionLogsAsync();
    Task<IEnumerable<ExecutionLog>> GetWorkflowExecutionLogsAsync(string workflowInstanceId);
    Task LogExecutionAsync(ExecutionLog log);

    // 任务调度相关方法
    Task<string> ScheduleTaskAsync(WorkflowTask task, string workflowId);
    Task<bool> CancelTaskAsync(string taskInstanceId);
    Task<TaskInstance?> GetTaskInstanceAsync(string taskId, string workflowInstanceId);
    Task<IEnumerable<TaskInstance>> GetTaskInstancesAsync(string workflowInstanceId);
    Task UpdateTaskInstanceStateAsync(string taskInstanceId, TaskState state, string? resultData = null, string? log = null);
}