namespace DyDanmaku.API.Application.Commands;

public class StopCaptureJobCommand : IRequest<bool>
{
    public int RoomId { get; set; }
}
