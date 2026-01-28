namespace DyDanmaku.API.Application.Commands;

public class StartCaptureJobCommand : IRequest<Result<RoomDto>>
{
    public int RoomId { get; set; }
    public int Duration { get; set; } = 3600;
}
