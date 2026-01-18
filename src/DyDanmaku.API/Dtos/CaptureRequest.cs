namespace DyDanmaku.API.Dtos;

internal class CaptureRequest
{
    public int Duration { get; set; }
    public int RoomId { get; set; }
}

internal class CaptureStopRequest
{
    public int RoomId { get; set; }
}

internal class CaptureResponse
{
    public int RoomId { get; set; }
    public string AnchorName { get; set; } = string.Empty;
}