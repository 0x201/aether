namespace DyDanmaku.API.Application.Services;

public class CaptureJobManager(
    IServiceScopeFactory serviceScopeFactory,
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

        var service = CreateDanmakuCaptureService();

        service.SetCleanupCallback(OnCaptureCompleted);

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
            logger.ZLogError($"Failed to start danmaku capture service for room {roomId}. Expcetion: {ex}");
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
            logger.ZLogWarning($"No active job found in memory for room [{roomId}]");
            return false;
        }
    }

    private IDanmakuCaptureService CreateDanmakuCaptureService()
    {
        var taskScope = serviceProvider.CreateScope();
        var service = new DanmakuCaptureService(
            taskScope.ServiceProvider.GetRequiredService<IServiceProvider>(),
            taskScope.ServiceProvider.GetRequiredService<IMemoryTaskScheduler>(),
            taskScope.ServiceProvider.GetRequiredService<IHttpClientFactory>(),
            taskScope.ServiceProvider.GetRequiredService<IConfiguration>(),
            taskScope.ServiceProvider.GetRequiredService<ILogger<DanmakuCaptureService>>()
        );
        return service;
    }

    private void OnCaptureCompleted(int roomId)
    {
        if (_activeJobs.TryRemove(roomId, out var _))
        {
            logger.ZLogInformation($"Completed danmaku capture task for room [{roomId}] and removed from memory");
        }
    }

    public override void Dispose()
    {
        try
        {
            if (!_requests.Writer.TryComplete())
            {
                _requests.Writer.Complete();
            }
        }
        catch (InvalidOperationException) { }
        base.Dispose();
    }
}

internal class ActiveCaptureJob
{
    public required IDanmakuCaptureService Service { get; set; }
    public required CaptureJob JobRecord { get; set; }
    public DateTime StartTime { get; set; }
}