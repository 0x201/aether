using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// 添加CORS支持
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddDbContextFactory<EtlDbContext>(options =>
{
    var dbPath = Path.Combine(AppContext.BaseDirectory, "data", "etl_metadata.db");
    options.UseSqlite($"Data Source={dbPath}");
});

// 添加工作流服务
builder.Services.AddSingleton<IWorkflowRepository, InMemoryWorkflowRepository>();
builder.Services.AddSingleton<INodeExecutor, NodeExecutor>();
builder.Services.AddSingleton<IWorkflowScheduler, WorkflowScheduler>();
builder.Services.AddSingleton<IEtlService, EtlService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Configure the HTTP request pipeline.

// 使用CORS中间件
app.UseCors("AllowAll");

app.UseHttpsRedirection();

// 工作流 API 端点
var workflows = app.MapGroup("/api/workflows");

// 获取所有工作流
workflows.MapGet("/", async (IWorkflowRepository repository) =>
{
    var workflowList = await repository.GetAllWorkflowsAsync();
    return Results.Ok(workflowList);
});

// 根据ID获取工作流
workflows.MapGet("/{id}", async (string id, IWorkflowRepository repository) =>
{
    var workflow = await repository.GetWorkflowByIdAsync(id);
    return workflow is not null ? Results.Ok(workflow) : Results.NotFound();
});

// 创建新工作流
workflows.MapPost("/", async (WorkflowModel workflow, IWorkflowRepository repository) =>
{
    var createdWorkflow = await repository.CreateWorkflowAsync(workflow);
    return Results.Created($"/api/workflows/{createdWorkflow.Id}", createdWorkflow);
});

// 更新工作流
workflows.MapPut("/{id}", async (string id, WorkflowModel workflow, IWorkflowRepository repository) =>
{
    workflow.Id = id;
    var updatedWorkflow = await repository.UpdateWorkflowAsync(workflow);
    return Results.Ok(updatedWorkflow);
});

// 删除工作流
workflows.MapDelete("/{id}", async (string id, IWorkflowRepository repository) =>
{
    var result = await repository.DeleteWorkflowAsync(id);
    return result ? Results.NoContent() : Results.NotFound();
});

// 执行工作流
workflows.MapPost("/{id}/execute", async (string id, IWorkflowRepository repository, IWorkflowScheduler scheduler) =>
{
    var workflow = await repository.GetWorkflowByIdAsync(id);
    if (workflow is null)
    {
        return Results.NotFound();
    }

    var workflowInstanceId = await scheduler.ScheduleWorkflowAsync(workflow);
    return Results.Ok(new { WorkflowInstanceId = workflowInstanceId });
});

// 获取正在运行的工作流
workflows.MapGet("/running", async (IWorkflowScheduler scheduler) =>
{
    var runningWorkflows = await scheduler.GetRunningWorkflowsAsync();
    return Results.Ok(runningWorkflows);
});

// 获取所有执行日志
workflows.MapGet("/logs", async (IWorkflowScheduler scheduler) =>
{
    var logs = await scheduler.GetExecutionLogsAsync();
    return Results.Ok(logs);
});

// 根据工作流实例ID获取执行日志
workflows.MapGet("/logs/{workflowInstanceId}", async (string workflowInstanceId, IWorkflowScheduler scheduler) =>
{
    var logs = await scheduler.GetWorkflowExecutionLogsAsync(workflowInstanceId);
    return Results.Ok(logs);
});

// 获取工作流执行状态
workflows.MapGet("/{id}/status", async (string id, IWorkflowScheduler scheduler, IWorkflowRepository repository) =>
{
    var workflow = await repository.GetWorkflowByIdAsync(id);
    if (workflow is null)
    {
        return Results.NotFound();
    }

    // 这里应该返回工作流的执行状态
    // 在实际实现中，你可能需要一个更复杂的状态跟踪机制
    var status = new
    {
        workflowId = id,
        workflowName = workflow.Name,
        status = "idle", // 可以是: idle, running, completed, failed
        lastExecutionTime = workflow.UpdatedAt ?? workflow.CreatedAt,
        message = "Workflow is ready to execute"
    };

    return Results.Ok(status);
});

// ETL API 端点
var etl = app.MapGroup("/api/etl");

// 执行ETL工作流
etl.MapPost("/execute/{workflowId}", async (string workflowId, IWorkflowRepository repository, IEtlService etlService) =>
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
    catch (Exception)
    {
        return Results.InternalServerError();
    }
});

// 获取ETL数据库列表
etl.MapGet("/databases", (IEtlService etlService) =>
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
    catch (Exception)
    {
        return Results.InternalServerError();
    }
});

// 获取特定数据库中的表列表
etl.MapGet("/databases/{databaseName}/tables", async (string databaseName, IEtlService etlService) =>
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
    catch (Exception)
    {
        return Results.InternalServerError();
    }
});

// 获取特定表的数据
etl.MapGet("/databases/{databaseName}/tables/{tableName}", async (string databaseName, string tableName, IEtlService etlService) =>
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
    catch (Exception)
    {
        return Results.InternalServerError();
    }
});

app.Run();