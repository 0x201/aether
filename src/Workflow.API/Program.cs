using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Workflow.API.Services;
using Microsoft.AspNetCore.SignalR;

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
    options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=WorkflowEtlDb;Trusted_Connection=true;MultipleActiveResultSets=true");
});

// 添加WorkflowDbContext
builder.Services.AddDbContextFactory<WorkflowDbContext>(options =>
{
    options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=WorkflowDb;Trusted_Connection=true;MultipleActiveResultSets=true");
});

// 添加SignalR支持
builder.Services.AddSignalR();

// 添加工作流服务
builder.Services.AddScoped<IWorkflowRepository, EfWorkflowRepository>();
builder.Services.AddSingleton<INodeExecutor, NodeExecutor>();
builder.Services.AddSingleton<IWorkflowScheduler, WorkflowScheduler>();
builder.Services.AddSingleton<IEtlService, EtlService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
    // 确保数据库已创建
    using (var scope = app.Services.CreateScope())
    {
        var workflowDbContext = scope.ServiceProvider.GetRequiredService<WorkflowDbContext>();
        workflowDbContext.Database.EnsureCreated();
        
        var etlDbContext = scope.ServiceProvider.GetRequiredService<EtlDbContext>();
        etlDbContext.Database.EnsureCreated();
        
        // 初始化示例工作流数据
        var workflowRepository = scope.ServiceProvider.GetRequiredService<IWorkflowRepository>();
        await InitializeSampleWorkflows(workflowRepository);
    }
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

// Map SignalR hub
app.MapHub<JobStatusHub>("/jobstatus");

// 初始化示例工作流
async Task InitializeSampleWorkflows(IWorkflowRepository repository)
{
    var workflows = await repository.GetAllWorkflowsAsync();
    if (!workflows.Any())
    {
        // 确保ETL示例文件存在
        var etlSamplePath = Path.Combine(AppContext.BaseDirectory, "data", "etl_sample.json");
        if (!File.Exists(etlSamplePath))
        {
            // 创建示例ETL数据文件
            var sampleData = new[]
            {
                new { id = 1, name = "John Doe", email = "john.doe@example.com", age = 30, department = "Engineering" },
                new { id = 2, name = "Jane Smith", email = "jane.smith@example.com", age = 25, department = "Marketing" },
                new { id = 3, name = "Bob Johnson", email = "bob.johnson@example.com", age = 35, department = "Sales" }
            };
            
            var json = System.Text.Json.JsonSerializer.Serialize(sampleData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(etlSamplePath, json);
        }

        // 简单线性工作流
        var workflow1 = new WorkflowModel
        {
            Id = "1",
            Name = "Simple Linear Workflow",
            Nodes = new List<WorkflowNode>
            {
                new WorkflowNode
                {
                    Id = "1",
                    Type = "start",
                    Position = new Position { X = 100, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Start", 
                        OperatorType = "start" 
                    }
                },
                new WorkflowNode
                {
                    Id = "2",
                    Type = "dummy",
                    Position = new Position { X = 300, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Process Data", 
                        OperatorType = "dummy",
                        Description = "Process the extracted data"
                    }
                },
                new WorkflowNode
                {
                    Id = "3",
                    Type = "dummy",
                    Position = new Position { X = 500, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Validate Results", 
                        OperatorType = "dummy",
                        Description = "Validate processed results"
                    }
                },
                new WorkflowNode
                {
                    Id = "4",
                    Type = "end",
                    Position = new Position { X = 700, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "End", 
                        OperatorType = "end" 
                    }
                }
            },
            Connections = new List<WorkflowConnection>
            {
                new WorkflowConnection { Id = "1-2", SourceNodeId = "1", TargetNodeId = "2" },
                new WorkflowConnection { Id = "2-3", SourceNodeId = "2", TargetNodeId = "3" },
                new WorkflowConnection { Id = "3-4", SourceNodeId = "3", TargetNodeId = "4" }
            }
        };
        await repository.CreateWorkflowAsync(workflow1);

        // 决策工作流
        var workflow2 = new WorkflowModel
        {
            Id = "2",
            Name = "Decision Workflow",
            Nodes = new List<WorkflowNode>
            {
                new WorkflowNode
                {
                    Id = "1",
                    Type = "start",
                    Position = new Position { X = 100, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Start", 
                        OperatorType = "start" 
                    }
                },
                new WorkflowNode
                {
                    Id = "2",
                    Type = "dummy",
                    Position = new Position { X = 300, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Data Analysis", 
                        OperatorType = "dummy",
                        Description = "Analyze data for decision making"
                    }
                },
                new WorkflowNode
                {
                    Id = "3",
                    Type = "branch",
                    Position = new Position { X = 500, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Check Value", 
                        OperatorType = "branch",
                        Description = "Check if value is high or low",
                        TaskParams = new Dictionary<string, object> { { "condition", "data.value > 100" } }
                    }
                },
                new WorkflowNode
                {
                    Id = "4",
                    Type = "dummy",
                    Position = new Position { X = 700, Y = 50 },
                    Data = new NodeData 
                    { 
                        Label = "High Value Path", 
                        OperatorType = "dummy",
                        Description = "Process high value data"
                    }
                },
                new WorkflowNode
                {
                    Id = "5",
                    Type = "dummy",
                    Position = new Position { X = 700, Y = 150 },
                    Data = new NodeData 
                    { 
                        Label = "Low Value Path", 
                        OperatorType = "dummy",
                        Description = "Process low value data"
                    }
                },
                new WorkflowNode
                {
                    Id = "6",
                    Type = "end",
                    Position = new Position { X = 900, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "End", 
                        OperatorType = "end" 
                    }
                }
            },
            Connections = new List<WorkflowConnection>
            {
                new WorkflowConnection { Id = "1-2", SourceNodeId = "1", TargetNodeId = "2" },
                new WorkflowConnection { Id = "2-3", SourceNodeId = "2", TargetNodeId = "3" },
                new WorkflowConnection { Id = "3-4", SourceNodeId = "3", TargetNodeId = "4", SourceHandle = "true" },
                new WorkflowConnection { Id = "3-5", SourceNodeId = "3", TargetNodeId = "5", SourceHandle = "false" },
                new WorkflowConnection { Id = "4-6", SourceNodeId = "4", TargetNodeId = "6" },
                new WorkflowConnection { Id = "5-6", SourceNodeId = "5", TargetNodeId = "6" }
            }
        };
        await repository.CreateWorkflowAsync(workflow2);

        // 复杂工作流
        var workflow3 = new WorkflowModel
        {
            Id = "3",
            Name = "Complex Workflow",
            Nodes = new List<WorkflowNode>
            {
                new WorkflowNode
                {
                    Id = "1",
                    Type = "start",
                    Position = new Position { X = 100, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Start", 
                        OperatorType = "start" 
                    }
                },
                new WorkflowNode
                {
                    Id = "2",
                    Type = "dummy",
                    Position = new Position { X = 300, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Data Ingestion", 
                        OperatorType = "dummy",
                        Description = "Ingest data from various sources"
                    }
                },
                new WorkflowNode
                {
                    Id = "3",
                    Type = "dummy",
                    Position = new Position { X = 500, Y = 50 },
                    Data = new NodeData 
                    { 
                        Label = "ETL Process", 
                        OperatorType = "dummy",
                        Description = "Extract, Transform, Load data"
                    }
                },
                new WorkflowNode
                {
                    Id = "4",
                    Type = "dummy",
                    Position = new Position { X = 500, Y = 150 },
                    Data = new NodeData 
                    { 
                        Label = "Data Validation", 
                        OperatorType = "dummy",
                        Description = "Validate ingested data"
                    }
                },
                new WorkflowNode
                {
                    Id = "5",
                    Type = "branch",
                    Position = new Position { X = 700, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Quality Check", 
                        OperatorType = "branch",
                        Description = "Check data quality",
                        TaskParams = new Dictionary<string, object> { { "condition", "data.quality > 0.8" } }
                    }
                },
                new WorkflowNode
                {
                    Id = "6",
                    Type = "dummy",
                    Position = new Position { X = 900, Y = 50 },
                    Data = new NodeData 
                    { 
                        Label = "High Quality Processing", 
                        OperatorType = "dummy",
                        Description = "Process high quality data"
                    }
                },
                new WorkflowNode
                {
                    Id = "7",
                    Type = "dummy",
                    Position = new Position { X = 900, Y = 150 },
                    Data = new NodeData 
                    { 
                        Label = "Error Handling", 
                        OperatorType = "dummy",
                        Description = "Handle low quality data"
                    }
                },
                new WorkflowNode
                {
                    Id = "8",
                    Type = "dummy",
                    Position = new Position { X = 1100, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Data Storage", 
                        OperatorType = "dummy",
                        Description = "Store processed data"
                    }
                },
                new WorkflowNode
                {
                    Id = "9",
                    Type = "end",
                    Position = new Position { X = 1300, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "End", 
                        OperatorType = "end" 
                    }
                }
            },
            Connections = new List<WorkflowConnection>
            {
                new WorkflowConnection { Id = "1-2", SourceNodeId = "1", TargetNodeId = "2" },
                new WorkflowConnection { Id = "2-3", SourceNodeId = "2", TargetNodeId = "3" },
                new WorkflowConnection { Id = "2-4", SourceNodeId = "2", TargetNodeId = "4" },
                new WorkflowConnection { Id = "3-5", SourceNodeId = "3", TargetNodeId = "5" },
                new WorkflowConnection { Id = "4-5", SourceNodeId = "4", TargetNodeId = "5" },
                new WorkflowConnection { Id = "5-6", SourceNodeId = "5", TargetNodeId = "6", SourceHandle = "true" },
                new WorkflowConnection { Id = "5-7", SourceNodeId = "5", TargetNodeId = "7", SourceHandle = "false" },
                new WorkflowConnection { Id = "6-8", SourceNodeId = "6", TargetNodeId = "8" },
                new WorkflowConnection { Id = "7-8", SourceNodeId = "7", TargetNodeId = "8" },
                new WorkflowConnection { Id = "8-9", SourceNodeId = "8", TargetNodeId = "9" }
            }
        };
        await repository.CreateWorkflowAsync(workflow3);

        // ETL工作流
        var workflow4 = new WorkflowModel
        {
            Id = "4",
            Name = "ETL Workflow",
            Nodes = new List<WorkflowNode>
            {
                new WorkflowNode
                {
                    Id = "1",
                    Type = "start",
                    Position = new Position { X = 100, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Start", 
                        OperatorType = "start" 
                    }
                },
                new WorkflowNode
                {
                    Id = "2",
                    Type = "extract",
                    Position = new Position { X = 300, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Extract Data", 
                        OperatorType = "extract",
                        Description = "Extract data from JSON file",
                        TaskParams = new Dictionary<string, object> 
                        { 
                            { "filePath", "data/sample.json" }
                        }
                    }
                },
                new WorkflowNode
                {
                    Id = "3",
                    Type = "validate",
                    Position = new Position { X = 500, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Validate Data", 
                        OperatorType = "validate",
                        Description = "Validate extracted data quality"
                    }
                },
                new WorkflowNode
                {
                    Id = "4",
                    Type = "load",
                    Position = new Position { X = 700, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "Load to Database", 
                        OperatorType = "load",
                        Description = "Load validated data to in-memory database",
                        TaskParams = new Dictionary<string, object> 
                        { 
                            { "tableName", "etl_data" }
                        }
                    }
                },
                new WorkflowNode
                {
                    Id = "5",
                    Type = "end",
                    Position = new Position { X = 900, Y = 100 },
                    Data = new NodeData 
                    { 
                        Label = "End", 
                        OperatorType = "end" 
                    }
                }
            },
            Connections = new List<WorkflowConnection>
            {
                new WorkflowConnection { Id = "1-2", SourceNodeId = "1", TargetNodeId = "2" },
                new WorkflowConnection { Id = "2-3", SourceNodeId = "2", TargetNodeId = "3" },
                new WorkflowConnection { Id = "3-4", SourceNodeId = "3", TargetNodeId = "4" },
                new WorkflowConnection { Id = "4-5", SourceNodeId = "4", TargetNodeId = "5" }
            }
        };
        await repository.CreateWorkflowAsync(workflow4);
    }
}

app.Run();

// SignalR Hub for job status updates
public class JobStatusHub : Hub
{
    public async Task SubscribeToJob(string jobId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, jobId);
    }
}