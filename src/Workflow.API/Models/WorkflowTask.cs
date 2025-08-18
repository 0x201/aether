namespace Workflow.API.Models;

/// <summary>
/// 工作流任务模型，参考Apache Airflow的任务概念
/// </summary>
public class WorkflowTask
{
    /// <summary>
    /// 任务ID
    /// </summary>
    [Required]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 任务名称
    /// </summary>
    [Required]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 任务类型（对应Airflow中的Operator类型）
    /// </summary>
    [Required]
    public string Type { get; set; } = "dummy";

    /// <summary>
    /// 任务配置数据
    /// </summary>
    public NodeData Data { get; set; } = new();

    /// <summary>
    /// 任务在工作流中的位置
    /// </summary>
    public Position Position { get; set; } = new();

    /// <summary>
    /// 依赖的任务ID列表（上游任务）
    /// </summary>
    public List<string> Dependencies { get; set; } = new();

    /// <summary>
    /// 任务状态
    /// </summary>
    public TaskState State { get; set; } = TaskState.None;

    /// <summary>
    /// 任务开始执行时间
    /// </summary>
    public DateTime? StartTime { get; set; }

    /// <summary>
    /// 任务结束执行时间
    /// </summary>
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// 任务执行时长（毫秒）
    /// </summary>
    public long? Duration => 
        StartTime.HasValue && EndTime.HasValue 
            ? (long)(EndTime.Value - StartTime.Value).TotalMilliseconds 
            : null;

    /// <summary>
    /// 任务尝试次数
    /// </summary>
    public int TryNumber { get; set; } = 0;

    /// <summary>
    /// 最大重试次数
    /// </summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>
    /// 重试延迟（秒）
    /// </summary>
    public int RetryDelaySeconds { get; set; } = 300; // 5分钟
}