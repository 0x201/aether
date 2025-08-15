using Workflow.API.Models;
using Workflow.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// 添加工作流服务
builder.Services.AddSingleton<IWorkflowRepository, InMemoryWorkflowRepository>();
builder.Services.AddSingleton<INodeExecutor, NodeExecutor>();
builder.Services.AddSingleton<IWorkflowScheduler, WorkflowScheduler>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

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

app.Run();