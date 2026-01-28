namespace DyDanmaku.API.Application.Commands;

public class StopCaptureJobHandler(ICaptureJobManager jobManager) : IRequestHandler<StopCaptureJobCommand, bool>
{
    public async Task<bool> Handle(StopCaptureJobCommand request, CancellationToken cancellationToken)
    {
        return await jobManager.StopAsync(request.RoomId, cancellationToken);
    }
}
