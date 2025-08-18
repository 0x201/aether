using Microsoft.EntityFrameworkCore;

namespace Workflow.API.Services;

public class EfWorkflowRepository : IWorkflowRepository
{
    private readonly IDbContextFactory<WorkflowDbContext> _contextFactory;

    public EfWorkflowRepository(IDbContextFactory<WorkflowDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task<WorkflowModel> CreateWorkflowAsync(WorkflowModel workflow)
    {
        using var context = _contextFactory.CreateDbContext();
        workflow.CreatedAt = DateTime.UtcNow;
        workflow.UpdatedAt = null;
        
        context.Workflows.Add(workflow);
        await context.SaveChangesAsync();
        
        return workflow;
    }

    public async Task<bool> DeleteWorkflowAsync(string id)
    {
        using var context = _contextFactory.CreateDbContext();
        var workflow = await context.Workflows.FindAsync(id);
        if (workflow == null)
        {
            return false;
        }

        context.Workflows.Remove(workflow);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<WorkflowModel>> GetAllWorkflowsAsync()
    {
        using var context = _contextFactory.CreateDbContext();
        return await context.Workflows.ToListAsync();
    }

    public async Task<WorkflowModel?> GetWorkflowByIdAsync(string id)
    {
        using var context = _contextFactory.CreateDbContext();
        return await context.Workflows.FindAsync(id);
    }

    public async Task<WorkflowModel> UpdateWorkflowAsync(WorkflowModel workflow)
    {
        using var context = _contextFactory.CreateDbContext();
        workflow.UpdatedAt = DateTime.UtcNow;
        
        context.Workflows.Update(workflow);
        await context.SaveChangesAsync();
        
        return workflow;
    }
}