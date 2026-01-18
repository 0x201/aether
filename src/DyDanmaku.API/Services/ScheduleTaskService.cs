namespace DyDanmaku.API.Services;

internal class ScheduledCaptureConfig
{
    public int RoomId { get; set; }
    public int Duration { get; set; }
    public string StartTime { get; set; } = string.Empty;
}

internal class ScheduleTaskService(
    ILogger<ScheduleTaskService> logger,
    IServiceScopeFactory serviceScopeFactory,
    IConfiguration configuration) : BackgroundService
{
    private const string ScheduledCaptureSection = "Douyu:ScheduledCapture:Tasks";
    private Timer? _timer;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ScheduleTaskService started");
        
        // Schedule the first run
        ScheduleNextRun();
        
        // Wait until cancellation is requested
        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // Expected when the service is stopping
        }
        
        logger.LogInformation("ScheduleTaskService stopped");
    }

    private void ScheduleNextRun()
    {
        var now = DateTimeOffset.UtcNow.ToLocalTime();
        var scheduledTasks = configuration.GetSection(ScheduledCaptureSection).Get<ScheduledCaptureConfig[]>();
        
        if (scheduledTasks is null || scheduledTasks.Length == 0)
        {
            logger.LogInformation("No scheduled capture tasks configured");
            _timer?.Dispose();
            _timer = new Timer(async _ => await TriggerCaptureJobs(), null, TimeSpan.FromHours(1), TimeSpan.FromHours(1));
            return;
        }

        var nextRunTime = FindNextRunTime(now, scheduledTasks);
        var delay = nextRunTime - now;

        logger.LogInformation("Scheduled task checker. Scheduling next run at {ScheduledTime}", nextRunTime);

        _timer?.Dispose();
        _timer = new Timer(async _ => await TriggerCaptureJobs(), null, delay, Timeout.InfiniteTimeSpan);
    }

    private DateTimeOffset FindNextRunTime(DateTimeOffset currentTime, ScheduledCaptureConfig[] scheduledTasks)
    {
        DateTimeOffset earliestPossibleTime = DateTimeOffset.MaxValue;
        
        foreach (var task in scheduledTasks)
        {
            var taskTime = ParseTime(task.StartTime);
            var today = new DateTime(currentTime.Year, currentTime.Month, currentTime.Day, taskTime.Hours, taskTime.Minutes, 0);
            var todayDateTime = new DateTimeOffset(today);
            if (todayDateTime > currentTime)
            {
                if (todayDateTime < earliestPossibleTime)
                {
                    earliestPossibleTime = todayDateTime;
                }
            }
            else
            {
                var tomorrowDateTime = todayDateTime.AddDays(1);
                if (tomorrowDateTime < earliestPossibleTime)
                {
                    earliestPossibleTime = tomorrowDateTime;
                }
            }
        }

        if (earliestPossibleTime == DateTime.MaxValue)
        {
            return currentTime.AddHours(1);
        }

        return earliestPossibleTime;
    }

    private TimeSpan ParseTime(string timeString)
    {
        var parts = timeString.Split(':');
        if (parts.Length >= 2 && int.TryParse(parts[0], out int hour) && int.TryParse(parts[1], out int minute))
        {
            return new TimeSpan(hour, minute, 0);
        }
        else
        {
            logger.LogWarning("Invalid time format: {TimeString}. Using default 10:00", timeString);
            return new TimeSpan(10, 0, 0);
        }
    }

    private async Task TriggerCaptureJobs()
    {
        try
        {
            logger.LogInformation("Checking for scheduled capture jobs");
            
            var now = DateTimeOffset.UtcNow.ToLocalTime();
            var scheduledTasks = configuration.GetSection(ScheduledCaptureSection).Get<ScheduledCaptureConfig[]>();
            
            if (scheduledTasks is null || scheduledTasks.Length == 0)
            {
                logger.LogInformation("No scheduled capture tasks configured");
                ScheduleNextRun();
                return;
            }

            foreach (var task in scheduledTasks)
            {
                var taskTime = ParseTime(task.StartTime);
                var today = new DateTime(now.Year, now.Month, now.Day, taskTime.Hours, taskTime.Minutes, 0);
                var taskDateTime = new DateTimeOffset(today);

                if (Math.Abs((now - taskDateTime).TotalMinutes) < 5)
                {
                    logger.LogInformation("Starting scheduled capture for room {RoomId} at {StartTime}", task.RoomId, task.StartTime);
                    
                    bool started;
                    using (var scope = serviceScopeFactory.CreateScope())
                    {
                        var captureJobManager = scope.ServiceProvider.GetRequiredService<ICaptureJobManager>();
                        started = await captureJobManager.StartAsync(task.RoomId, task.Duration);
                    }
                    
                    if (started)
                    {
                        logger.LogInformation("Successfully started scheduled capture for room {RoomId} with duration {Duration}s", task.RoomId, task.Duration);
                    }
                    else
                    {
                        logger.LogWarning("Failed to start scheduled capture for room {RoomId}, possibly already running", task.RoomId);
                    }
                }
            }
            
            ScheduleNextRun();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while checking scheduled capture jobs");
            
            ScheduleNextRun();
        }
    }

    public override void Dispose()
    {
        _timer?.Dispose();
        base.Dispose();
    }
}