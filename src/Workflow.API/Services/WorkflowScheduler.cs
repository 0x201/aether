using System.Collections.Concurrent;

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

        // 在后台执行工作流
        _ = System.Threading.Tasks.Task.Run(async () => await ExecuteWorkflowAsync(workflow, workflowInstanceId));

        return workflowInstanceId;
    }

    public Task<bool> CancelWorkflowAsync(string workflowInstanceId)
    {
        var result = _runningWorkflows.Remove(workflowInstanceId);
        return System.Threading.Tasks.Task.FromResult(result);
    }

    public Task<IEnumerable<string>> GetRunningWorkflowsAsync()
    {
        return System.Threading.Tasks.Task.FromResult(_runningWorkflows.Keys.AsEnumerable());
    }

    public Task<IEnumerable<ExecutionLog>> GetExecutionLogsAsync()
    {
        // 返回最近的100条日志
        var recentLogs = _executionLogs
            .OrderByDescending(log => log.Timestamp)
            .Take(100)
            .ToList();
            
        return System.Threading.Tasks.Task.FromResult(recentLogs.AsEnumerable());
    }

    public Task<IEnumerable<ExecutionLog>> GetWorkflowExecutionLogsAsync(string workflowInstanceId)
    {
        var workflowLogs = _executionLogs
            .Where(log => log.WorkflowId == workflowInstanceId)
            .OrderByDescending(log => log.Timestamp)
            .ToList();
            
        return System.Threading.Tasks.Task.FromResult(workflowLogs.AsEnumerable());
    }

    public Task LogExecutionAsync(ExecutionLog log)
    {
        _executionLogs.Add(log);
        return System.Threading.Tasks.Task.CompletedTask;
    }

    private async System.Threading.Tasks.Task ExecuteWorkflowAsync(WorkflowModel workflow, string workflowInstanceId)
    {
        try
        {
            Console.WriteLine($"Starting workflow execution: {workflow.Name} (Instance: {workflowInstanceId})");

            // 查找起始节点
            var startNode = workflow.Nodes.FirstOrDefault(n => n.Type == "start");
            if (startNode == null)
            {
                Console.WriteLine("No start node found in workflow");
                
                // 记录错误日志
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

            // 执行工作流
            await ExecuteNodeAndChildrenAsync(startNode, workflow, null, workflowInstanceId);

            Console.WriteLine($"Workflow execution completed: {workflow.Name} (Instance: {workflowInstanceId})");
            
            // 记录完成日志
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
            
            // 记录错误日志
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
            // 从运行列表中移除
            _runningWorkflows.Remove(workflowInstanceId);
        }
    }

    private async System.Threading.Tasks.Task ExecuteNodeAndChildrenAsync(WorkflowNode node, WorkflowModel workflow, object? inputData, string workflowInstanceId)
    {
        // 检查工作流是否已被取消
        // 注意：在实际实现中，您可能需要更复杂的取消机制

        // 执行当前节点
        Console.WriteLine($"Executing node: {node.Data.Label} (Type: {node.Type})");
        
        // 记录节点开始执行的日志
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
        
        // 记录节点执行完成的日志
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

        // 查找从此节点出发的连接
        var outgoingConnections = workflow.Connections
            .Where(c => c.SourceNodeId == node.Id)
            .ToList();

        // 递归执行子节点
        foreach (var connection in outgoingConnections)
        {
            var targetNode = workflow.Nodes.FirstOrDefault(n => n.Id == connection.TargetNodeId);
            if (targetNode != null)
            {
                // 特殊处理决策节点
                if ((node.Type == "decision" || node.Type == "branch") && outputData != null)
                {
                    try
                    {
                        string outputJson = System.Text.Json.JsonSerializer.Serialize(outputData);
                        var doc = System.Text.Json.JsonDocument.Parse(outputJson);
                        
                        // 检查决策结果
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
                        // 如果解析失败，继续执行所有路径
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
        
        // 在后台执行任务
        _ = System.Threading.Tasks.Task.Run(async () => await ExecuteTaskAsync(task, taskInstance));
        
        return taskInstanceId;
    }

    private async System.Threading.Tasks.Task ExecuteTaskAsync(WorkflowTask task, TaskInstance taskInstance)
    {
        try
        {
            // 更新任务状态为运行中
            await UpdateTaskInstanceStateAsync(taskInstance.WorkflowInstanceId, TaskState.Running);
            
            // 执行任务
            var result = await _nodeExecutor.ExecuteNodeAsync(task.Type, null);
            
            // 更新任务状态为成功
            var resultJson = System.Text.Json.JsonSerializer.Serialize(result);
            await UpdateTaskInstanceStateAsync(taskInstance.WorkflowInstanceId, TaskState.Success, resultJson);
        }
        catch (Exception ex)
        {
            // 更新任务状态为失败
            await UpdateTaskInstanceStateAsync(taskInstance.WorkflowInstanceId, TaskState.Failed, null, ex.Message);
        }
    }

    public Task<bool> CancelTaskAsync(string taskInstanceId)
    {
        return System.Threading.Tasks.Task.FromResult(_taskInstances.TryRemove(taskInstanceId, out _));
    }

    public Task<TaskInstance?> GetTaskInstanceAsync(string taskId, string workflowInstanceId)
    {
        var taskInstance = _taskInstances.Values
            .FirstOrDefault(ti => ti.TaskId == taskId && ti.WorkflowInstanceId == workflowInstanceId);
        return System.Threading.Tasks.Task.FromResult(taskInstance);
    }

    public Task<IEnumerable<TaskInstance>> GetTaskInstancesAsync(string workflowInstanceId)
    {
        var taskInstances = _taskInstances.Values
            .Where(ti => ti.WorkflowInstanceId == workflowInstanceId)
            .ToList();
        return System.Threading.Tasks.Task.FromResult(taskInstances.AsEnumerable());
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