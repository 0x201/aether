namespace Workflow.API.Models;

public class WorkflowNode
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // start, end, task, decision
    public NodeData Data { get; set; } = new();
    public Position Position { get; set; } = new();
}

public class NodeData
{
    public string Label { get; set; } = string.Empty;
    public string? TriggerCondition { get; set; }
    public string? TriggerEvent { get; set; }
    public string? ActionType { get; set; }
    public ActionConfig? ActionConfig { get; set; }
}

public class ActionConfig
{
    public string? Url { get; set; }
    public string? Method { get; set; }
    public Dictionary<string, string>? Headers { get; set; }
    public string? Body { get; set; }
}

public class Position
{
    public double X { get; set; }
    public double Y { get; set; }
}