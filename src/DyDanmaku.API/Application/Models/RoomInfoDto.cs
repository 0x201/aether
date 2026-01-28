namespace DyDanmaku.API.Application.Models;

public record RoomDto
{
    public int RoomId { get; set; }
    public string AnchorName { get; set; } = string.Empty;
}