namespace DyDanmaku.API.Application.Models;

public class CaptureRequest
{
    public int Duration { get; set; }
    public int RoomId { get; set; }
}

public class CaptureStopRequest
{
    public int RoomId { get; set; }
}

public class CaptureResponse
{
    public int RoomId { get; set; }
    public string AnchorName { get; set; } = string.Empty;
}