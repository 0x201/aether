namespace Workflow.API.Abstractions;

public interface INodeExecutor
{
    Task<object?> ExecuteNodeAsync(string nodeType, object? inputData);
}