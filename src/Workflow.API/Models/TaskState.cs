namespace Workflow.API.Models;

/// <summary>
/// 任务状态枚举
/// </summary>
public enum TaskState
{
    None,        // 未调度
    Scheduled,   // 已调度
    Queued,      // 已排队
    Running,     // 运行中
    Success,     // 成功
    Failed,      // 失败
    Skipped,     // 跳过
    UpstreamFailed, // 上游任务失败
    Retry        // 重试中
}