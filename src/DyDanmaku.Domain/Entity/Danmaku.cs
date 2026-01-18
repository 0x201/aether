namespace DyDanmaku.Domain.Entity;

public class Danmaku
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? Content { get; set; }
    public int? UserLevel { get; set; }
    public string? FanMedalName { get; set; }
    public int? FanMedalLevel { get; set; }
    public int? RoomId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
