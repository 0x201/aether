namespace DyDanmaku.Domain.Entity;

public class Room
{
    public int RoomId { get; set; }
    public required string RoomName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}