namespace DyDanmaku.Domain.Entity;

public class Room : BaseAuditableEntity<int>
{
    public int RoomId { get; set; }
    public required string RoomName { get; set; }
}