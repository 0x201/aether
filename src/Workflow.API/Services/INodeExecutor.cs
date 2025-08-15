namespace Workflow.API.Services;

public interface INodeExecutor
{
    Task<object?> ExecuteNodeAsync(string nodeType, object? inputData);
}