namespace DyDanmaku.API.Interfaces;

internal interface ICaptureJobRepository
{
    Task<CaptureJob?> CreateJobAsync(int roomId, int duration, CancellationToken cancellationToken = default);

    Task UpdateJobStatusAsync(int roomId, JobStatus status, CancellationToken cancellationToken = default);

    Task<List<CaptureJob>> GetExpiredJobsAsync(CancellationToken cancellationToken = default);

    Task<CaptureJob?> GetActiveJobByRoomIdAsync(int roomId, CancellationToken cancellationToken = default);

}
