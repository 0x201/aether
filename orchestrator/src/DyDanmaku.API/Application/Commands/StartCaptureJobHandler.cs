namespace DyDanmaku.API.Application.Commands;

public class StartCaptureJobHandler(
    ICaptureJobManager jobManager,
    ILogger<StartCaptureJobHandler> logger,
    ICaptureJobRepository jobRepository) : IRequestHandler<StartCaptureJobCommand, Result<RoomDto>>
{
    public async Task<Result<RoomDto>> Handle(StartCaptureJobCommand request, CancellationToken cancellationToken)
    {
        var success = await jobManager.StartAsync(request.RoomId, request.Duration, cancellationToken);

        if (!success)
        {
            logger.ZLogWarning($"A capture is already in progress for room {request.RoomId}");
            return Result<RoomDto>.Failure(HttpStatusCode.Conflict, "A capture is already in progress for this room", null);
        }

        var room = await jobRepository.GetRoomByIdAsync(request.RoomId, cancellationToken);

        var roomDto = new RoomDto
        {
            RoomId = room!.RoomId,
            RoomName = room.RoomName,
        };

        return Result<RoomDto>.Success(roomDto, "Capture started");
    }
}
