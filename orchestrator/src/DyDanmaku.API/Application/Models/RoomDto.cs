namespace DyDanmaku.API.Application.Models;

public record RoomDto
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}