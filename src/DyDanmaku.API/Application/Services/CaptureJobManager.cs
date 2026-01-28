namespace DyDanmaku.API.Application.Services;

public class CaptureJobManager(
    IServiceProvider serviceProvider,
    ILogger<CaptureJobManager> logger) : BackgroundService, ICaptureJobManager
{
    private readonly ConcurrentDictionary<int, ActiveCaptureJob> _activeJobs = [];
    private readonly Channel<(int roomId, int? duration, TaskCompletionSource<bool> tcs)> _startRequests =
        Channel.CreateBounded<(int roomId, int? duration, TaskCompletionSource<bool> tcs)>(100);
    private readonly Channel<(int roomId, int? duration, TaskCompletionSource<bool> tcs)> _stopRequests =
        Channel.CreateBounded<(int roomId, int? duration, TaskCompletionSource<bool> tcs)>(100);

    public async Task<bool> StartAsync(int roomId, int? duration, CancellationToken cancellationToken = default)
    {
        var tcs = new TaskCompletionSource<bool>();
        await _startRequests.Writer.WriteAsync((roomId, duration, tcs), cancellationToken);
        return await tcs.Task;
    }

    public async Task<bool> StopAsync(int roomId, CancellationToken cancellationToken = default)
    {
        var tcs = new TaskCompletionSource<bool>();
        await _stopRequests.Writer.WriteAsync((roomId, null, tcs), cancellationToken);
        return await tcs.Task;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var startTask = ProcessStartRequests(stoppingToken);

        var stopTask = ProcessStopRequests(stoppingToken);

        await Task.WhenAll(startTask, stopTask);
    }

    private async Task ProcessStartRequests(CancellationToken stoppingToken)
    {
        await foreach (var (roomId, duration, tcs) in _startRequests.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                var result = await ProcessStartRequestInternal(roomId, duration, stoppingToken);
                tcs.SetResult(result);
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        }
    }

    private async Task ProcessStopRequests(CancellationToken stoppingToken)
    {
        await foreach (var (roomId, _, tcs) in _stopRequests.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                var result = await ProcessStopRequestInternal(roomId, stoppingToken);
                tcs.SetResult(result);
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        }
    }

    private async Task<bool> ProcessStartRequestInternal(int roomId, int? duration, CancellationToken cancellationToken)
    {
        if (_activeJobs.ContainsKey(roomId))
        {
            return false;
        }

        using var scope = serviceProvider.CreateScope();
        var jobRepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();

        var existingJob = await jobRepository.GetActiveJobByRoomIdAsync(roomId, cancellationToken);
        if (existingJob is not null)
        {
            return false;
        }

        var taskScope = serviceProvider.CreateScope();
        var service = new DanmakuCaptureService(
            taskScope.ServiceProvider.GetRequiredService<IServiceProvider>(),
            taskScope.ServiceProvider.GetRequiredService<IMemoryTaskScheduler>(),
            taskScope.ServiceProvider.GetRequiredService<IHttpClientFactory>(),
            taskScope.ServiceProvider.GetRequiredService<IConfiguration>(),
            taskScope.ServiceProvider.GetRequiredService<ILogger<DanmakuCaptureService>>()
        );

        service.SetCleanupCallback(OnCaptureCompleted);

        var jobRecord = await jobRepository.CreateJobAsync(roomId, duration.GetValueOrDefault(3600), cancellationToken);
        if (jobRecord is null)
        {
            logger.LogError("Failed to create job record for room {RoomId}", roomId);
            taskScope.Dispose();
            return false;
        }

        await service.Start(roomId, duration.GetValueOrDefault(3600));

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

    private async Task<bool> ProcessStopRequestInternal(int roomId, CancellationToken cancellationToken)
    {
        bool wasRunning = false;

        if (_activeJobs.TryGetValue(roomId, out var activeJob))
        {
            await activeJob.Service.Stop();
            _activeJobs.TryRemove(roomId, out _);
            wasRunning = true;
        }

        using var scope = serviceProvider.CreateScope();
        var jobRepository = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();

        var activeJobInDb = await jobRepository.GetActiveJobByRoomIdAsync(roomId, cancellationToken);

        if (activeJobInDb is not null)
        {
            var finalStatus = wasRunning ? JobStatus.Completed : JobStatus.Cancelled;
            await jobRepository.UpdateJobStatusAsync(roomId, finalStatus, cancellationToken);

            logger.LogInformation("Stopped capture for room {RoomId}, updated DB status to {Status}", roomId, finalStatus);
        }
        else
        {
            logger.LogWarning("Attempted to stop capture for room {RoomId}, but no active job found in database", roomId);
        }

        return wasRunning;
    }

    private void OnCaptureCompleted(int roomId)
    {
        if (_activeJobs.TryRemove(roomId, out var _))
        {
            logger.LogInformation("Removed completed capture job from memory for room {RoomId}", roomId);
        }
    }

    public override void Dispose()
    {
        _startRequests.Writer.Complete();
        _stopRequests.Writer.Complete();
        base.Dispose();
    }
}

internal class ActiveCaptureJob
{
    public required IDanmakuCaptureService Service { get; set; }
    public required CaptureJob JobRecord { get; set; }
    public DateTime StartTime { get; set; }
}