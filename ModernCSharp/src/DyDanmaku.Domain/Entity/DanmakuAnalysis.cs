namespace DyDanmaku.Domain.Entity;

public class DanmakuAnalysis : BaseAuditableEntity<int>
{
    public int? RoomId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Frequencies { get; set; }
}
