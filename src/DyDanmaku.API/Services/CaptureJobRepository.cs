namespace DyDanmaku.API.Services;

internal class CaptureJobRepository(
    IDbContextFactory<DyDanmakuDbContext> dbContextFactory) : ICaptureJobRepository
{
    public async Task<CaptureJob?> CreateJobAsync(int roomId, int duration, CancellationToken cancellationToken = default)
    {
        using var dbContext = dbContextFactory.CreateDbContext();
        var activeJob = await dbContext.CaptureJobs
            .FirstOrDefaultAsync(j => j.RoomId == roomId && j.Status == JobStatus.Running.ToString(), cancellationToken);

        if (activeJob is not null)
        {
            return null;
        }

        var jobToAdd = new CaptureJob
        {
            RoomId = roomId,
            Status = JobStatus.Running.ToString(),
            StartTime = DateTimeOffset.UtcNow,
            Duration = duration,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var entry = await dbContext.CaptureJobs.AddAsync(jobToAdd, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return entry.Entity;
    }

    public async Task UpdateJobStatusAsync(int roomId, JobStatus status, CancellationToken cancellationToken = default)
    {
        using var dbContext = dbContextFactory.CreateDbContext();
        var activeJob = await dbContext.CaptureJobs
            .FirstOrDefaultAsync(j => j.RoomId == roomId && j.Status == JobStatus.Running.ToString(), cancellationToken);

        if (activeJob is null)
        {
            return;
        }

        activeJob.Status = status.ToString();
        activeJob.EndTime = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<CaptureJob>> GetExpiredJobsAsync(CancellationToken cancellationToken = default)
    {
        using var dbContext = dbContextFactory.CreateDbContext();
        return await dbContext.CaptureJobs
            .Where(j => j.Status == JobStatus.Running.ToString() && j.StartTime.AddSeconds(j.Duration) < DateTimeOffset.UtcNow)
            .ToListAsync(cancellationToken);
    }

    public async Task<CaptureJob?> GetActiveJobByRoomIdAsync(int roomId, CancellationToken cancellationToken = default)
    {
        using var dbContext = dbContextFactory.CreateDbContext();
        return await dbContext.CaptureJobs
            .FirstOrDefaultAsync(j => j.RoomId == roomId && j.Status == JobStatus.Running.ToString(), cancellationToken);
    }
}
