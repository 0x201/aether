namespace DyDanmaku.Domain.Entity;

public class CaptureJob : BaseAuditableEntity<int>
{
    public int RoomId { get; set; }
    public int Duration { get; set; }
    public required string Status { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
}
