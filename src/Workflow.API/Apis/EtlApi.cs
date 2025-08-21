using Microsoft.AspNetCore.Mvc;

public static class EtlApi
{
    public static RouteGroupBuilder MapEtlApiV1(this IEndpointRouteBuilder app)
    {
        var etl = app.MapGroup("/api/etl");

        etl.MapPost("/execute/{workflowId}", async (string workflowId, [FromServices] IWorkflowRepository repository, [FromServices] IEtlService etlService) =>
        {
            var workflow = await repository.GetWorkflowByIdAsync(workflowId);
            if (workflow is null)
            {
                return Results.NotFound($"Workflow with ID {workflowId} not found");
            }

            try
            {
                var result = await etlService.ExecuteEtlWorkflowAsync(workflow);
                return Results.Ok(result);
            }
            catch (EtlExecutionException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Internal server error: {ex.Message}", statusCode: 500);
            }
        });

        etl.MapGet("/databases", ([FromServices] IEtlService etlService) =>
        {
            try
            {
                var databases = etlService.ListDatabases();
                return Results.Ok(databases);
            }
            catch (EtlExecutionException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Internal server error: {ex.Message}", statusCode: 500);
            }
        });

        etl.MapGet("/tables/{databaseName}", async (string databaseName, [FromServices] IEtlService etlService) =>
        {
            try
            {
                var tables = await etlService.ListTablesAsync(databaseName);
                return Results.Ok(tables);
            }
            catch (EtlExecutionException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Internal server error: {ex.Message}", statusCode: 500);
            }
        });

        etl.MapGet("/table/{databaseName}/{tableName}", async (string databaseName, string tableName, [FromServices] IEtlService etlService) =>
        {
            try
            {
                var data = await etlService.SelectDataAsync(databaseName, tableName);
                return Results.Ok(data);
            }
            catch (EtlExecutionException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Internal server error: {ex.Message}", statusCode: 500);
            }
        });
        return etl;
    }
}
