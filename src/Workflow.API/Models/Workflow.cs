namespace Workflow.API.Models;

[Index(nameof(Name))]
public class WorkflowModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<WorkflowNode> Nodes { get; set; } = new();
    public List<WorkflowConnection> Connections { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class WorkflowNode
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // start, end, bash, python, email, http, sql, branch, subdag, sensor, dummy, custom
    public Position Position { get; set; } = new();
    public NodeData Data { get; set; } = new();
    public string? Status { get; set; } // pending, running, success, failed, skipped, upstream_failed, retry, no_status
}

public class NodeData
{
    // 基本信息
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    // Airflow Operator类型
    public string OperatorType { get; set; } = string.Empty;
    
    // Airflow任务参数
    public Dictionary<string, object>? TaskParams { get; set; }
    
    // Airflow特定配置
    public int? Retries { get; set; }
    public int? RetryDelay { get; set; } // 秒
    public int? PriorityWeight { get; set; }
    public string? Queue { get; set; }
    public string? Pool { get; set; }
    
    // 依赖关系
    public List<string>? UpstreamTasks { get; set; } // 上游任务列表
    public List<string>? DownstreamTasks { get; set; } // 下游任务列表
    
    // 触发规则
    public string? TriggerRule { get; set; } // all_success, all_failed, all_done, one_success, one_failed, none_failed, none_failed_or_skipped, none_skipped, dummy
    
    // 时间相关
    public string? StartDate { get; set; } // ISO格式日期
    public string? EndDate { get; set; } // ISO格式日期
    public int? Sla { get; set; } // 服务等级协议（分钟）
    
    // 条件表达式（用于决策节点）
    public string? TriggerCondition { get; set; }
    
    // 其他配置
    public Dictionary<string, object>? AdditionalConfig { get; set; }
}

public class Position
{
    public double X { get; set; }
    public double Y { get; set; }
}

public class WorkflowConnection
{
    public string Id { get; set; } = string.Empty;
    public string SourceNodeId { get; set; } = string.Empty;
    public string TargetNodeId { get; set; } = string.Empty;
    public string? SourceHandle { get; set; }
    public string? TargetHandle { get; set; }
}

// 添加执行日志模型
public class ExecutionLog
{
    public string Id { get; set; } = string.Empty;
    public string WorkflowId { get; set; } = string.Empty;
    public string WorkflowName { get; set; } = string.Empty;
    public string? NodeId { get; set; }
    public string? NodeName { get; set; }
    public string? NodeType { get; set; }
    public string Status { get; set; } = string.Empty; // pending, running, success, failed, cancelled
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object>? Details { get; set; }
}