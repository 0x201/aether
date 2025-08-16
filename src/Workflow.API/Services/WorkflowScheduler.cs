using Workflow.API.Models;

namespace Workflow.API.Services;

public class WorkflowScheduler : IWorkflowScheduler
{
    private readonly INodeExecutor _nodeExecutor;
    private readonly Dictionary<string, bool> _runningWorkflows = new();
    private readonly List<ExecutionLog> _executionLogs = new();

    public WorkflowScheduler(INodeExecutor nodeExecutor)
    {
        _nodeExecutor = nodeExecutor ?? throw new ArgumentNullException(nameof(nodeExecutor));
    }

    public async Task<string> ScheduleWorkflowAsync(WorkflowModel workflow)
    {
        var workflowInstanceId = Guid.NewGuid().ToString();
        _runningWorkflows[workflowInstanceId] = true;

        // 记录工作流开始执行的日志
        await LogExecutionAsync(new ExecutionLog
        {
            Id = Guid.NewGuid().ToString(),
            WorkflowId = workflow.Id,
            WorkflowName = workflow.Name,
            Status = "running",
            Message = $"Workflow '{workflow.Name}' started",
            Timestamp = DateTime.UtcNow
        });

        // 在后台执行工作流
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
        // 返回最近的100条日志
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

    private async Task ExecuteWorkflowAsync(WorkflowModel workflow, string workflowInstanceId)
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

    private async Task ExecuteNodeAndChildrenAsync(WorkflowNode node, WorkflowModel workflow, object? inputData, string workflowInstanceId)
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
                    // 根据决策结果选择路径
                    bool decisionResult = GetDecisionResult(outputData);
                    bool isTruePath = connection.SourceHandle == "true";
                    
                    Console.WriteLine($"Decision result: {decisionResult}, Connection path: {connection.SourceHandle}");
                    
                    if ((decisionResult && isTruePath) || (!decisionResult && !isTruePath))
                    {
                        Console.WriteLine($"Following path to node: {targetNode.Data.Label}");
                        await ExecuteNodeAndChildrenAsync(targetNode, workflow, outputData, workflowInstanceId);
                    }
                }
                else
                {
                    // 正常执行后续节点
                    Console.WriteLine($"Following path to node: {targetNode.Data.Label}");
                    await ExecuteNodeAndChildrenAsync(targetNode, workflow, outputData, workflowInstanceId);
                }
            }
        }
    }

    private bool GetDecisionResult(object decisionOutput)
    {
        try
        {
            var json = System.Text.Json.JsonSerializer.Serialize(decisionOutput);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            
            if (doc.RootElement.TryGetProperty("decisionResult", out var resultElement))
            {
                return resultElement.GetBoolean();
            }
        }
        catch
        {
            // 如果解析失败，默认为false
        }
        
        return false;
    }
}