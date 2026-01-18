namespace DyDanmaku.Domain.Entity;

public class DanmakuAnalysis
{
    public int Id { get; set; }
    public int? RoomId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Frequencies { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
