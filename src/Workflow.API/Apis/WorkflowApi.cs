using Microsoft.AspNetCore.Mvc;


public static class WorkflowApi
{
    public static RouteGroupBuilder MapWorkflowsApiV1(this IEndpointRouteBuilder app)
    {
        var workflows = app.MapGroup("/api/workflows");

        workflows.MapGet("/", async ([FromServices]IWorkflowRepository repository) =>
        {
            var workflowList = await repository.GetAllWorkflowsAsync();
            return Results.Ok(workflowList);
        });

        workflows.MapGet("/{id}", async (string id, [FromServices] IWorkflowRepository repository) =>
        {
            var workflow = await repository.GetWorkflowByIdAsync(id);
            return workflow is not null ? Results.Ok(workflow) : Results.NotFound();
        });

        workflows.MapPost("/", async ([FromBody] WorkflowModel workflow, [FromServices] IWorkflowRepository repository) =>
        {
            var createdWorkflow = await repository.CreateWorkflowAsync(workflow);
            return Results.Created($"/api/workflows/{createdWorkflow.Id}", createdWorkflow);
        });

        workflows.MapPut("/{id}", async (string id, [FromBody] WorkflowModel workflow, [FromServices] IWorkflowRepository repository) =>
        {
            if (id != workflow.Id)
            {
                return Results.BadRequest("Workflow ID mismatch");
            }

            var updatedWorkflow = await repository.UpdateWorkflowAsync(workflow);
            return Results.Ok(updatedWorkflow);
        });

        workflows.MapDelete("/{id}", async (string id, [FromServices] IWorkflowRepository repository) =>
        {
            var result = await repository.DeleteWorkflowAsync(id);
            return result ? Results.NoContent() : Results.NotFound();
        });

        workflows.MapPost("/{id}/execute", async (string id, [FromServices] IWorkflowScheduler scheduler, [FromServices] IWorkflowRepository repository) =>
        {
            var workflow = await repository.GetWorkflowByIdAsync(id);
            if (workflow is null)
            {
                return Results.NotFound();
            }

            var workflowInstanceId = await scheduler.ScheduleWorkflowAsync(workflow);
            return Results.Ok(new { WorkflowInstanceId = workflowInstanceId });
        });

        workflows.MapGet("/running", async ([FromServices] IWorkflowScheduler scheduler) =>
        {
            var runningWorkflows = await scheduler.GetRunningWorkflowsAsync();
            return Results.Ok(runningWorkflows);
        });

        workflows.MapGet("/logs", async ([FromServices] IWorkflowScheduler scheduler) =>
        {
            var logs = await scheduler.GetExecutionLogsAsync();
            return Results.Ok(logs);
        });

        workflows.MapGet("/logs/{workflowInstanceId}", async (string workflowInstanceId, [FromServices] IWorkflowScheduler scheduler) =>
        {
            var logs = await scheduler.GetWorkflowExecutionLogsAsync(workflowInstanceId);
            return Results.Ok(logs);
        });

        workflows.MapGet("/{id}/status", async (string id, [FromServices] IWorkflowScheduler scheduler, [FromServices] IWorkflowRepository repository) =>
        {
            var workflow = await repository.GetWorkflowByIdAsync(id);
            if (workflow is null)
            {
                return Results.NotFound();
            }

            var status = new
            {
                workflowId = id,
                workflowName = workflow.Name,
                status = "idle",
                lastExecutionTime = workflow.UpdatedAt ?? workflow.CreatedAt,
                message = "Workflow is ready to execute"
            };

            return Results.Ok(status);
        });

        return workflows;
    }
}
