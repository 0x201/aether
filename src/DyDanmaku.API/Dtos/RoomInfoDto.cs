namespace DyDanmaku.API.Dtos;

internal record RoomDto
{
    public int RoomId { get; set; }
    public string AnchorName { get; set; } = string.Empty;
}