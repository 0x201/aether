using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Workflow.API.Models;

public class TaskInstance
{
    public string TaskId { get; set; } = string.Empty;
    public string WorkflowId { get; set; } = string.Empty;
    public string WorkflowInstanceId { get; set; } = string.Empty;
    public TaskState State { get; set; }
    public string? ResultData { get; set; }
    public string? Log { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}