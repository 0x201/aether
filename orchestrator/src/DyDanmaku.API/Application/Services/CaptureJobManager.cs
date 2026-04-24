namespace DyDanmaku.API.Application.Services;

public class CaptureJobManager(
    IServiceScopeFactory serviceScopeFactory,
    IDanmakuCaptureServiceFactory captureServiceFactory,
    ICaptureTaskStore captureTaskStore,
    ILogger<CaptureJobManager> logger) : BackgroundService, ICaptureJobManager
{
    private readonly ConcurrentDictionary<int, ActiveCaptureJob> _activeJobs = [];
    private enum RequestType
    {
        Start,
        Stop
    }

    private readonly Channel<(RequestType type, int roomId, int? duration, TaskCompletionSource<bool> tcs)> _requests =
        Channel.CreateBounded<(RequestType type, int roomId, int? duration, TaskCompletionSource<bool> tcs)>(100);

    public async Task<bool> StartAsync(int roomId, int? duration, CancellationToken cancellationToken = default)
    {
        var tcs = new TaskCompletionSource<bool>();
        await _requests.Writer.WriteAsync((RequestType.Start, roomId, duration, tcs), cancellationToken);
        return await tcs.Task;
    }

    public async Task<bool> StopAsync(int roomId, CancellationToken cancellationToken = default)
    {
        var tcs = new TaskCompletionSource<bool>();
        await _requests.Writer.WriteAsync((RequestType.Stop, roomId, null, tcs), cancellationToken);
        return await tcs.Task;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RecoverTaskAsync(stoppingToken);
        
        var processTask = ProcessRequests(stoppingToken);

        try
        {
            await processTask;
        }
        catch (OperationCanceledException)
        {
            // Normal shutdown, no error logging
        }
        catch (Exception ex)
        {
            logger.ZLogError($"Unhandled exception occurred while processing danmaku capture job requests. Exception: {ex}");
        }
    }

    private async Task RecoverTaskAsync(CancellationToken cancellationToken)
    {
        logger.ZLogInformation($"Starting task recovery process...");
        List<CaptureTaskMetadata> candidates;

        try
        {
            candidates = [..await captureTaskStore.GetAllAsync(cancellationToken)];
        }
        catch (Exception ex)
        {
            logger.ZLogError($"Redis unavailable during recovery, falling back to database scan. Exception: {ex}");
            candidates = await FallbackGetRunningTasksFromDbAsync(cancellationToken);
        }

        if (candidates.Count == 0)
        {
            logger.ZLogInformation($"No capture tasks to recover");
            return;
        }

        using var scope = serviceScopeFactory.CreateScope();
        var jobrepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();

        foreach (var metadata in candidates)
        {
            try
            {
                var dbJob = await jobrepository.GetActiveJobByRoomIdAsync(metadata.RoomId, cancellationToken);

                if (dbJob is null)
                {
                    // Redis key exists but DB has no running job - stale key, clean up and skip
                    await captureTaskStore.RemoveAsync(metadata.RoomId, cancellationToken);
                    logger.ZLogWarning($"Stale Redis key found for room [{metadata.RoomId}], no DB running job record, removed");
                    continue;
                }

                var elapsed = DateTimeOffset.UtcNow - metadata.StartTime;
                var remaining = (int)(metadata.Duration - elapsed.TotalSeconds);

                if (remaining <= 0)
                {
                    // Task already expired - mark job as Terminated and clean up Redis key
                    await jobrepository.UpdateJobStatusAsync(metadata.RoomId, JobStatus.Terminated, cancellationToken);
                    await captureTaskStore.RemoveAsync(metadata.RoomId, cancellationToken);
                    logger.ZLogWarning($"Capture task from [{metadata.RoomId}] has expired during downtime, marked job as Terminated and removed Redis key");
                    continue;
                }
                logger.ZLogInformation($"Recovering capture task for room [{metadata.RoomId}] with remaining duration [{remaining}s]");
                await ProcessStartRequestInternal(metadata.RoomId, remaining, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.ZLogError($"Failed to recover task for room [{metadata.RoomId}]. Exception: {ex}");
            }
        }
        logger.ZLogInformation($"Capture task recovery process completed, recovered [{candidates.Count}] tasks");
    }

    private async Task<List<CaptureTaskMetadata>> FallbackGetRunningTasksFromDbAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var jobRepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();
            var expiredJobs = await jobRepository.GetExpiredJobsAsync(cancellationToken);

            var dbContext = scope.ServiceProvider.GetRequiredService<DyDanmakuDbContext>();
            var runningJobs = await dbContext.Set<CaptureJob>()
                .Where(j => j.Status == JobStatus.Running.ToString())
                .ToListAsync(cancellationToken);

            return [.. runningJobs.Select(j => new CaptureTaskMetadata(j.RoomId, j.Duration, j.StartTime))];
        }
        catch (Exception ex)
        {
            logger.ZLogError($"Fallback DB scan for running tasks failed. Exception: {ex}");
            return [];
        }
    } 

    private async Task ProcessRequests(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (var (type, roomId, duration, tcs) in _requests.Reader.ReadAllAsync(stoppingToken))
            {
                try
                {
                    bool result = false;
                    switch (type)
                    {
                        case RequestType.Start:
                            result = await ProcessStartRequestInternal(roomId, duration, stoppingToken);
                            break;
                        case RequestType.Stop:
                            result = await ProcessStopRequestInternal(roomId, stoppingToken);
                            break;
                    }
                    tcs.SetResult(result);
                }
                catch (Exception ex)
                {
                    tcs.SetException(ex);
                }
            }
        }
        catch (OperationCanceledException)
        {
            logger.ZLogTrace($"Request processor was cancelled");
        }
        catch (Exception ex)
        {
            logger.ZLogError($"An error occurred while processing requests. Exception: {ex}");
        }
    }

    private async Task<bool> ProcessStartRequestInternal(int roomId, int? duration, CancellationToken cancellationToken)
    {
        if (_activeJobs.ContainsKey(roomId))
        {
            logger.ZLogInformation($"Room {roomId} already has an active job, cannot start duplicate");
            return false;
        }

        using var scope = serviceScopeFactory.CreateScope();
        var jobRepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();

        var existingJob = await jobRepository.GetActiveJobByRoomIdAsync(roomId, cancellationToken);
        if (existingJob is not null)
        {
            logger.ZLogInformation($"An active job for room {roomId} already exists in the database, cannot start a new job");
            return false;
        }

        var service = captureServiceFactory.Create();

        service.SetCleanupCallback(OnCaptureCompletedAsync);

        var jobRecord = await jobRepository.CreateJobAsync(roomId, duration.GetValueOrDefault(3600), cancellationToken);
        if (jobRecord is null)
        {
            logger.ZLogError($"Failed to create job record for room {roomId}");
            return false;
        }

        try
        {
            await service.StartAsync(roomId, duration.GetValueOrDefault(3600));
        }
        catch (Exception ex)
        {
            logger.ZLogError($"Failed to start danmaku capture service for room {roomId}. Exception: {ex}");
            await jobRepository.UpdateJobStatusAsync(roomId, JobStatus.Failed, cancellationToken);
            return false;
        }

        var activeJob = new ActiveCaptureJob
        {
            Service = service,
            JobRecord = jobRecord,
            StartTime = DateTime.UtcNow
        };

        _activeJobs.TryAdd(roomId, activeJob);
        await captureTaskStore.SaveAsync(roomId, new CaptureTaskMetadata(roomId, duration.GetValueOrDefault(3600), DateTimeOffset.UtcNow), cancellationToken);

        logger.ZLogInformation($"Started danmaku capture for room [{roomId}]");
        return true;
    }

    private async Task<bool> ProcessStopRequestInternal(int roomId, CancellationToken cancellationToken = default)
    {
        if (_activeJobs.TryGetValue(roomId, out var activeJob))
        {
            try
            {
                await activeJob.Service.StopAsync();
                _activeJobs.TryRemove(roomId, out _);
                await captureTaskStore.RemoveAsync(roomId, cancellationToken);
                logger.ZLogInformation($"Successfully stopped danmaku capture service for room [{roomId}]");
                return true;
            }
            catch (Exception ex)
            {
                logger.ZLogError($"An error occurred while stopping danmaku capture service for room [{roomId}]. Exception: {ex}");
                return false;
            }
        }
        else
        {

            logger.ZLogWarning($"No active job found in memory for room [{roomId}], checking database for orphaned running job");
            try
            {
                using var scope = serviceScopeFactory.CreateScope();
                var jobRepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();
                var orphanedJob = await jobRepository.GetActiveJobByRoomIdAsync(roomId, cancellationToken);
                if (orphanedJob is not null)
                {
                    await jobRepository.UpdateJobStatusAsync(roomId, JobStatus.Terminated, cancellationToken);
                    logger.ZLogWarning($"Found orphaned running job for room [{roomId}] in database (likely from abnormal exit), marked as Terminated");
                    return true;
                }
            }
            catch (Exception ex)
            {
                logger.ZLogError($"Failed to check or update ophaned job status for room [{roomId}] in the database. Exception: {ex}");
                throw;
            }
            logger.ZLogWarning($"No active job found in memory or database for room [{roomId}]");
            return false;
        }
    }

    private async Task OnCaptureCompletedAsync(int roomId, JobStatus status)
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var jobRepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();
            await jobRepository.UpdateJobStatusAsync(roomId, status);
        }
        catch (Exception ex)
        {
            logger.ZLogError($"Failed to update job status to {status} for room [{roomId}] in the database. Exception: {ex}");
        }
        finally
        {
            await captureTaskStore.RemoveAsync(roomId);
            if (_activeJobs.TryRemove(roomId, out _))
            {
                logger.ZLogInformation($"Completed danmaku capture task for room [{roomId}] with status {status} and removed from memory");
            }
        }
    }

    public override void Dispose()
    {
        _requests.Writer.TryComplete();
        base.Dispose();
    }
}

internal class ActiveCaptureJob
{
    public required IDanmakuCaptureService Service { get; set; }
    public required CaptureJob JobRecord { get; set; }
    public DateTime StartTime { get; set; }
}