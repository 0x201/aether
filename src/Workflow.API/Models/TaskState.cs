namespace Workflow.API.Models;

public enum TaskState
{
    None,
    Scheduled,
    Queued,
    Running,
    Success,
    Failed,
    Skipped,
    UpstreamFailed,
    Retry
}