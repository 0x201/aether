namespace DyDanmaku.API.Application.Commands;

public class StartCaptureJobHandler(
    ICaptureJobManager jobManager,
    ILogger<StartCaptureJobHandler> logger,
    DyDanmakuDbContext dbContext) : IRequestHandler<StartCaptureJobCommand, Result<RoomDto>>
{
    public async Task<Result<RoomDto>> Handle(StartCaptureJobCommand request, CancellationToken cancellationToken)
    {
        var success = await jobManager.StartAsync(request.RoomId, request.Duration, cancellationToken);

        if (!success)
        {
            logger.LogWarning("A capture is already in progress for room {RoomId}", request.RoomId);
            return Result<RoomDto>.Failure(HttpStatusCode.Conflict, "A capture is already in progress for this room", null);
        }

        var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.RoomId == request.RoomId, cancellationToken);

        var roomDto = new RoomDto
        {
            RoomId = room!.RoomId,
            AnchorName = room.RoomName,
        };

        return Result<RoomDto>.Success(roomDto, "Capture started");
    }
}
