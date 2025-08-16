using Workflow.API.Models;

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
}