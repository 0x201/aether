using System.Text.Json;

namespace Workflow.API.Services;

public class NodeExecutor : INodeExecutor
{
    public async Task<object?> ExecuteNodeAsync(string nodeType, object? inputData)
    {
        return nodeType.ToLower() switch
        {
            "start" => await ExecuteStartNodeAsync(inputData),
            "task" => await ExecuteTaskNodeAsync(inputData),
            "decision" => await ExecuteDecisionNodeAsync(inputData),
            "end" => await ExecuteEndNodeAsync(inputData),
            _ => inputData
        };
    }

    private async Task<object> ExecuteStartNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var startData = new
        {
            workflowStarted = true,
            startTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "start",
            nodeType = "start",
            message = "Workflow started"
        };
        
        return startData;
    }

    private async Task<object> ExecuteTaskNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var taskData = new
        {
            taskId = Guid.NewGuid().ToString(),
            taskExecuted = true,
            executionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "task",
            nodeType = "task",
            message = "Task executed"
        };
        
        return taskData;
    }

    private async Task<object> ExecuteDecisionNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        // 简单的决策逻辑 - 检查输入数据中的某个值
        bool decisionResult = false;
        
        if (inputData != null)
        {
            try
            {
                string inputJson = JsonSerializer.Serialize(inputData);
                var doc = JsonDocument.Parse(inputJson);
                
                // 尝试从输入数据中获取决策条件
                if (doc.RootElement.TryGetProperty("value", out var valueElement))
                {
                    if (valueElement.ValueKind == JsonValueKind.Number)
                    {
                        decisionResult = valueElement.GetDouble() > 5;
                    }
                }
            }
            catch
            {
                // 如果解析失败，默认为false
                decisionResult = false;
            }
        }
        
        var decisionData = new
        {
            decisionMade = true,
            decisionResult = decisionResult,
            decisionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "decision",
            nodeType = "decision",
            message = $"Decision evaluated as {decisionResult}"
        };
        
        return decisionData;
    }

    private async Task<object> ExecuteEndNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var endData = new
        {
            workflowEnded = true,
            endTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "end",
            nodeType = "end",
            message = "Workflow completed"
        };
        
        return endData;
    }
}