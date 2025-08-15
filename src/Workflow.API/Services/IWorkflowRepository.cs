using Workflow.API.Models;

namespace Workflow.API.Services;

public interface IWorkflowRepository
{
    Task<IEnumerable<WorkflowModel>> GetAllWorkflowsAsync();
    Task<WorkflowModel?> GetWorkflowByIdAsync(string id);
    Task<WorkflowModel> CreateWorkflowAsync(WorkflowModel workflow);
    Task<WorkflowModel> UpdateWorkflowAsync(WorkflowModel workflow);
    Task<bool> DeleteWorkflowAsync(string id);
}