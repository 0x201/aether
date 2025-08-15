using Workflow.API.Models;

namespace Workflow.API.Services;

public class WorkflowScheduler : IWorkflowScheduler
{
    private readonly INodeExecutor _nodeExecutor;
    private readonly Dictionary<string, bool> _runningWorkflows = new();

    public WorkflowScheduler(INodeExecutor nodeExecutor)
    {
        _nodeExecutor = nodeExecutor;
    }

    public async Task<string> ScheduleWorkflowAsync(WorkflowModel workflow)
    {
        var workflowInstanceId = Guid.NewGuid().ToString();
        _runningWorkflows[workflowInstanceId] = true;

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
                return;
            }

            // 执行工作流
            await ExecuteNodeAndChildrenAsync(startNode, workflow, null);

            Console.WriteLine($"Workflow execution completed: {workflow.Name} (Instance: {workflowInstanceId})");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error executing workflow {workflow.Name}: {ex.Message}");
        }
        finally
        {
            // 从运行列表中移除
            _runningWorkflows.Remove(workflowInstanceId);
        }
    }

    private async Task ExecuteNodeAndChildrenAsync(WorkflowNode node, WorkflowModel workflow, object? inputData)
    {
        // 检查工作流是否已被取消
        // 注意：在实际实现中，您可能需要更复杂的取消机制

        // 执行当前节点
        var outputData = await _nodeExecutor.ExecuteNodeAsync(node.Type, inputData);

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
                if (node.Type == "decision" && outputData != null)
                {
                    // 根据决策结果选择路径
                    bool decisionResult = GetDecisionResult(outputData);
                    bool isTruePath = connection.SourceHandle == "true";
                    
                    if ((decisionResult && isTruePath) || (!decisionResult && !isTruePath))
                    {
                        await ExecuteNodeAndChildrenAsync(targetNode, workflow, outputData);
                    }
                }
                else
                {
                    // 正常执行后续节点
                    await ExecuteNodeAndChildrenAsync(targetNode, workflow, outputData);
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