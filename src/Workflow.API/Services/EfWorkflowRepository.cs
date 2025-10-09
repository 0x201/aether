namespace Workflow.API.Services;

public class EfWorkflowRepository : IWorkflowRepository
{
    private readonly IDbContextFactory<WorkflowDbContext> _contextFactory;
    private readonly ILogger<EfWorkflowRepository> _logger;

    public EfWorkflowRepository(IDbContextFactory<WorkflowDbContext> contextFactory, ILogger<EfWorkflowRepository> logger)
    {
        _contextFactory = contextFactory;
        _logger = logger;
    }

    public async Task<WorkflowModel> CreateWorkflowAsync(WorkflowModel workflow)
    {
        _logger.LogInformation("Creating workflow with ID: {WorkflowId}", workflow.Id);
        
        using var context = _contextFactory.CreateDbContext();
        workflow.CreatedAt = DateTime.UtcNow;
        workflow.UpdatedAt = null;
        
        try
        {
            context.Workflows.Add(workflow);
            await context.SaveChangesAsync();
            
            _logger.LogInformation("Successfully created workflow with ID: {WorkflowId}", workflow.Id);
            return workflow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating workflow with ID: {WorkflowId}", workflow.Id);
            throw;
        }
    }

    public async Task<bool> DeleteWorkflowAsync(string id)
    {
        _logger.LogInformation("Deleting workflow with ID: {WorkflowId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        
        try
        {
            var workflow = await context.Workflows.FindAsync(id);
            if (workflow == null)
            {
                _logger.LogWarning("Workflow with ID: {WorkflowId} not found for deletion", id);
                return false;
            }

            context.Workflows.Remove(workflow);
            await context.SaveChangesAsync();
            
            _logger.LogInformation("Successfully deleted workflow with ID: {WorkflowId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting workflow with ID: {WorkflowId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<WorkflowModel>> GetAllWorkflowsAsync()
    {
        _logger.LogInformation("Retrieving all workflows");
        
        using var context = _contextFactory.CreateDbContext();
        
        try
        {
            var workflows = await context.Workflows.ToListAsync();
            _logger.LogInformation("Successfully retrieved {Count} workflows", workflows.Count);
            return workflows;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving workflows");
            throw;
        }
    }

    public async Task<WorkflowModel?> GetWorkflowByIdAsync(string id)
    {
        _logger.LogInformation("Retrieving workflow with ID: {WorkflowId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        
        try
        {
            var workflow = await context.Workflows.FindAsync(id);
            if (workflow != null)
            {
                _logger.LogInformation("Successfully retrieved workflow with ID: {WorkflowId}", id);
            }
            else
            {
                _logger.LogWarning("Workflow with ID: {WorkflowId} not found", id);
            }
            
            return workflow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving workflow with ID: {WorkflowId}", id);
            throw;
        }
    }

    public async Task<WorkflowModel> UpdateWorkflowAsync(WorkflowModel workflow)
    {
        _logger.LogInformation("Updating workflow with ID: {WorkflowId}", workflow.Id);
        
        using var context = _contextFactory.CreateDbContext();
        workflow.UpdatedAt = DateTime.UtcNow;
        
        try
        {
            context.Workflows.Update(workflow);
            await context.SaveChangesAsync();
            
            _logger.LogInformation("Successfully updated workflow with ID: {WorkflowId}", workflow.Id);
            return workflow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating workflow with ID: {WorkflowId}", workflow.Id);
            throw;
        }
    }
}
