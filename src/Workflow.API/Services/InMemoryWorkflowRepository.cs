using Workflow.API.Models;

namespace Workflow.API.Services;

public class InMemoryWorkflowRepository : IWorkflowRepository
{
    private readonly Dictionary<string, WorkflowModel> _workflows = new();

    public Task<IEnumerable<WorkflowModel>> GetAllWorkflowsAsync()
    {
        return Task.FromResult(_workflows.Values.AsEnumerable());
    }

    public Task<WorkflowModel?> GetWorkflowByIdAsync(string id)
    {
        _workflows.TryGetValue(id, out var workflow);
        return Task.FromResult(workflow);
    }

    public Task<WorkflowModel> CreateWorkflowAsync(WorkflowModel workflow)
    {
        workflow.Id = Guid.NewGuid().ToString();
        workflow.CreatedAt = DateTime.UtcNow;
        _workflows[workflow.Id] = workflow;
        return Task.FromResult(workflow);
    }

    public Task<WorkflowModel> UpdateWorkflowAsync(WorkflowModel workflow)
    {
        workflow.UpdatedAt = DateTime.UtcNow;
        _workflows[workflow.Id] = workflow;
        return Task.FromResult(workflow);
    }

    public Task<bool> DeleteWorkflowAsync(string id)
    {
        var result = _workflows.Remove(id);
        return Task.FromResult(result);
    }
}