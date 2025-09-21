using System.Collections.Concurrent;
using Workflow.API.Abstractions;

namespace Workflow.API.Services;

public class WorkflowScheduler : IWorkflowScheduler
{
    private readonly INodeExecutor _nodeExecutor;
    private readonly Dictionary<string, bool> _runningWorkflows = new();
    private readonly List<ExecutionLog> _executionLogs = new();
    private readonly ConcurrentDictionary<string, TaskInstance> _taskInstances = new();

    public WorkflowScheduler(INodeExecutor nodeExecutor)
    {
        _nodeExecutor = nodeExecutor;
    }

    public async Task<string> ScheduleWorkflowAsync(WorkflowModel workflow)
    {
        var workflowInstanceId = Guid.NewGuid().ToString();
        _runningWorkflows[workflowInstanceId] = true;

        _ = Task.Run(async () => await ExecuteWorkflowAsync(workflow, workflowInstanceId));

        return workflowInstanceId;
    }

    public Task<bool> CancelWorkflowAsync(string workflowInstanceId)
    {
        var result = _runningWorkflows.Remove(workflowInstanceId);
        return Task.FromResult(result);
    }

    public Task<IEnumerable<string>> GetRunningWorkflowsAsync()
    {
        return Task.FromResult(_runningWorkflows.Keys.AsEnumerable());
    }

    public Task<IEnumerable<ExecutionLog>> GetExecutionLogsAsync()
    {
        var recentLogs = _executionLogs
            .OrderByDescending(log => log.Timestamp)
            .Take(100)
            .ToList();
            
        return Task.FromResult(recentLogs.AsEnumerable());
    }

    public Task<IEnumerable<ExecutionLog>> GetWorkflowExecutionLogsAsync(string workflowInstanceId)
    {
        var workflowLogs = _executionLogs
            .Where(log => log.WorkflowId == workflowInstanceId)
            .OrderByDescending(log => log.Timestamp)
            .ToList();
            
        return Task.FromResult(workflowLogs.AsEnumerable());
    }

    public Task LogExecutionAsync(ExecutionLog log)
    {
        _executionLogs.Add(log);
        return Task.CompletedTask;
    }

    private async System.Threading.Tasks.Task ExecuteWorkflowAsync(WorkflowModel workflow, string workflowInstanceId)
    {
        try
        {
            Console.WriteLine($"Starting workflow execution: {workflow.Name} (Instance: {workflowInstanceId})");

            var startNode = workflow.Nodes.FirstOrDefault(n => n.Type == "start");
            if (startNode == null)
            {
                Console.WriteLine("No start node found in workflow");
                
                await LogExecutionAsync(new ExecutionLog
                {
                    Id = Guid.NewGuid().ToString(),
                    WorkflowId = workflow.Id,
                    WorkflowName = workflow.Name,
                    Status = "failed",
                    Message = "No start node found in workflow",
                    Timestamp = DateTime.UtcNow
                });
                
                return;
            }

            await ExecuteNodeAndChildrenAsync(startNode, workflow, null, workflowInstanceId);

            Console.WriteLine($"Workflow execution completed: {workflow.Name} (Instance: {workflowInstanceId})");
            
            await LogExecutionAsync(new ExecutionLog
            {
                Id = Guid.NewGuid().ToString(),
                WorkflowId = workflow.Id,
                WorkflowName = workflow.Name,
                Status = "success",
                Message = $"Workflow '{workflow.Name}' completed successfully",
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error executing workflow {workflow.Name}: {ex.Message}");
            
            await LogExecutionAsync(new ExecutionLog
            {
                Id = Guid.NewGuid().ToString(),
                WorkflowId = workflow.Id,
                WorkflowName = workflow.Name,
                Status = "failed",
                Message = $"Error executing workflow: {ex.Message}",
                Timestamp = DateTime.UtcNow
            });
        }
        finally
        {
            _runningWorkflows.Remove(workflowInstanceId);
        }
    }

    private async Task ExecuteNodeAndChildrenAsync(WorkflowNode node, WorkflowModel workflow, object? inputData, string workflowInstanceId)
    {
        Console.WriteLine($"Executing node: {node.Data.Label} (Type: {node.Type})");
        
        await LogExecutionAsync(new ExecutionLog
        {
            Id = Guid.NewGuid().ToString(),
            WorkflowId = workflow.Id,
            WorkflowName = workflow.Name,
            NodeId = node.Id,
            NodeName = node.Data.Label,
            NodeType = node.Type,
            Status = "running",
            Message = $"Executing node '{node.Data.Label}' ({node.Type})",
            Timestamp = DateTime.UtcNow
        });

        var outputData = await _nodeExecutor.ExecuteNodeAsync(node.Type, inputData);
        Console.WriteLine($"Node execution result: {System.Text.Json.JsonSerializer.Serialize(outputData)}");
        
        await LogExecutionAsync(new ExecutionLog
        {
            Id = Guid.NewGuid().ToString(),
            WorkflowId = workflow.Id,
            WorkflowName = workflow.Name,
            NodeId = node.Id,
            NodeName = node.Data.Label,
            NodeType = node.Type,
            Status = "success",
            Message = $"Node '{node.Data.Label}' executed successfully",
            Timestamp = DateTime.UtcNow,
            Details = new Dictionary<string, object> { { "output", outputData ?? new object() } }
        });

        var outgoingConnections = workflow.Connections
            .Where(c => c.SourceNodeId == node.Id)
            .ToList();

        foreach (var connection in outgoingConnections)
        {
            var targetNode = workflow.Nodes.FirstOrDefault(n => n.Id == connection.TargetNodeId);
            if (targetNode != null)
            {
                if ((node.Type == "decision" || node.Type == "branch") && outputData != null)
                {
                    try
                    {
                        string outputJson = System.Text.Json.JsonSerializer.Serialize(outputData);
                        var doc = System.Text.Json.JsonDocument.Parse(outputJson);
                        
                        if (doc.RootElement.TryGetProperty("decisionResult", out var decisionElement))
                        {
                            bool shouldExecute = decisionElement.GetBoolean();
                            if (!shouldExecute)
                            {
                                Console.WriteLine($"Skipping node {targetNode.Data.Label} based on decision result");
                                continue;
                            }
                        }
                    }
                    catch
                    {
                    }
                }
                
                await ExecuteNodeAndChildrenAsync(targetNode, workflow, outputData, workflowInstanceId);
            }
        }
    }

    public async Task<string> ScheduleTaskAsync(WorkflowTask task, string workflowId)
    {
        var taskInstanceId = Guid.NewGuid().ToString();
        
        var taskInstance = new TaskInstance
        {
            TaskId = task.Id,
            WorkflowId = workflowId,
            WorkflowInstanceId = taskInstanceId,
            State = TaskState.Queued,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _taskInstances[taskInstanceId] = taskInstance;
        
        _ = Task.Run(async () => await ExecuteTaskAsync(task, taskInstance));
        
        return taskInstanceId;
    }

    private async System.Threading.Tasks.Task ExecuteTaskAsync(WorkflowTask task, TaskInstance taskInstance)
    {
        try
        {
            await UpdateTaskInstanceStateAsync(taskInstance.WorkflowInstanceId, TaskState.Running);
            
            var result = await _nodeExecutor.ExecuteNodeAsync(task.Type, null);
            
            var resultJson = System.Text.Json.JsonSerializer.Serialize(result);
            await UpdateTaskInstanceStateAsync(taskInstance.WorkflowInstanceId, TaskState.Success, resultJson);
        }
        catch (Exception ex)
        {
            await UpdateTaskInstanceStateAsync(taskInstance.WorkflowInstanceId, TaskState.Failed, null, ex.Message);
        }
    }

    public Task<bool> CancelTaskAsync(string taskInstanceId)
    {
        return Task.FromResult(_taskInstances.TryRemove(taskInstanceId, out _));
    }

    public Task<TaskInstance?> GetTaskInstanceAsync(string taskId, string workflowInstanceId)
    {
        var taskInstance = _taskInstances.Values
            .FirstOrDefault(ti => ti.TaskId == taskId && ti.WorkflowInstanceId == workflowInstanceId);
        return Task.FromResult(taskInstance);
    }

    public Task<IEnumerable<TaskInstance>> GetTaskInstancesAsync(string workflowInstanceId)
    {
        var taskInstances = _taskInstances.Values
            .Where(ti => ti.WorkflowInstanceId == workflowInstanceId)
            .ToList();
        return Task.FromResult(taskInstances.AsEnumerable());
    }

    public Task UpdateTaskInstanceStateAsync(string taskInstanceId, TaskState state, string? resultData = null, string? log = null)
    {
        if (_taskInstances.TryGetValue(taskInstanceId, out var taskInstance))
        {
            taskInstance.State = state;
            taskInstance.ResultData = resultData;
            taskInstance.Log = log;
            taskInstance.UpdatedAt = DateTime.UtcNow;
            
            if (state == TaskState.Running)
            {
                taskInstance.StartTime = DateTime.UtcNow;
            }
            else if (state is TaskState.Success or TaskState.Failed)
            {
                taskInstance.EndTime = DateTime.UtcNow;
            }
        }
        
        return Task.CompletedTask;
    }
}