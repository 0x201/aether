namespace DyDanmaku.API.Services;

internal class CaptureJobManager(
    IServiceScopeFactory serviceScopeFactory,
    IDanmakuCaptureServiceFactory serviceFactory,
    ILogger<CaptureJobManager> logger) : ICaptureJobManager
{
    private readonly ConcurrentDictionary<int, ActiveCaptureJob> _activeJobs = [];

    public async Task<bool> StartAsync(int roomId, int? duration, CancellationToken cancellationToken = default)
    {
        if (_activeJobs.ContainsKey(roomId))
        {
            return false; // Already running
        }

        using var scope = serviceScopeFactory.CreateScope();
        var jobRepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();

        // Check database for existing active job
        var existingJob = await jobRepository.GetActiveJobByRoomIdAsync(roomId, cancellationToken);
        if (existingJob is not null)
        {
            return false; // Already running
        }

        // Create new service instance for this capture
        var service = serviceFactory.CreateService();

        // Set up cleanup callback to remove job from memory when capture completes
        service.SetCleanupCallback(OnCaptureCompleted);

        // Create persistent job record
        var jobRecord = await jobRepository.CreateJobAsync(roomId, duration.GetValueOrDefault(3600), cancellationToken);
        if (jobRecord is null)
        {
            logger.LogError("Failed to create job record for room {RoomId}", roomId);
            return false;
        }

        // Start the capture
        await service.Start(roomId, duration.GetValueOrDefault(3600));

        // Track the active job
        var activeJob = new ActiveCaptureJob
        {
            Service = service,
            JobRecord = jobRecord,
            StartTime = DateTime.UtcNow
        };

        _activeJobs.TryAdd(roomId, activeJob);

        logger.LogInformation("Started capture for room {RoomId}", roomId);
        return true;
    }

    public async Task<bool> StopAsync(int roomId, CancellationToken cancellationToken = default)
    {
        bool wasRunning = false;
        
        if (_activeJobs.TryGetValue(roomId, out var activeJob))
        {
            await activeJob.Service.Stop();
            _activeJobs.TryRemove(roomId, out _);
            serviceFactory.ReleaseService(activeJob.Service);
            wasRunning = true;
        }

        using var scope = serviceScopeFactory.CreateScope();
        var jobRepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();

        var activeJobInDb = await jobRepository.GetActiveJobByRoomIdAsync(roomId, cancellationToken);
        
        if (activeJobInDb is not null)
        {
            // Update job status in database to Completed if it was running, otherwise Cancelled
            var finalStatus = wasRunning ? JobStatus.Completed : JobStatus.Cancelled;
            await jobRepository.UpdateJobStatusAsync(roomId, finalStatus, cancellationToken);
            
            logger.LogInformation("Stopped capture for room {RoomId}, updated DB status to {Status}", roomId, finalStatus);
        }
        else
        {
            logger.LogWarning("Attempted to stop capture for room {RoomId}, but no active job found in database", roomId);
        }

        return wasRunning; // Return true only if the job was actually running in memory
    }

    private void OnCaptureCompleted(int roomId)
    {
        // Remove the job from memory when capture completes naturally
        if (_activeJobs.TryRemove(roomId, out var activeJob))
        {
            logger.LogInformation("Removed completed capture job from memory for room {RoomId}", roomId);
            serviceFactory.ReleaseService(activeJob.Service);
        }
    }
}

internal class ActiveCaptureJob
{
    public required IDanmakuCaptureService Service { get; set; }
    public required CaptureJob JobRecord { get; set; }
    public DateTime StartTime { get; set; }
}