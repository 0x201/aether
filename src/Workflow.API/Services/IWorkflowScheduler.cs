using Workflow.API.Models;

namespace Workflow.API.Services;

public interface IWorkflowScheduler
{
    Task<string> ScheduleWorkflowAsync(WorkflowModel workflow);
    Task<bool> CancelWorkflowAsync(string workflowInstanceId);
    Task<IEnumerable<string>> GetRunningWorkflowsAsync();
}