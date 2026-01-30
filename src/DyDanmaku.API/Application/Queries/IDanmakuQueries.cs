namespace DyDanmaku.API.Application.Queries;

public interface IDanmakuQueries
{
    Task<PagedListResult<DanmakuWithRoom>> GetPagedList(CaptureJobRequest request, CancellationToken cancellationToken = default);
    Task< PagedListResult<RoomDto>> GetPagedRooms(RoomRequest request, CancellationToken cancellationToken = default);
    Task<PagedListResult<CaptureJobDto>> GetPagedCaptureJobs(CaptureJobRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<WordFrequency>>> GetAnalysisData(DanmakuAnalysisRequest request, CancellationToken cancellationToken = default);
    Task<Result<DanmakuStats>> GetDanmakuStats(DanmakuAnalysisRequest request, CancellationToken cancellationToken = default);
    Task<Result<DataCount>> GetDanmakuCount(CancellationToken cancellationToken = default);
    Task<Result<CaptureJobDto>> GetActiveJob(int roomId, CancellationToken cancellationToken = default);
}
