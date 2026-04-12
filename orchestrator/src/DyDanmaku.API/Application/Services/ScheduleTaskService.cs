namespace DyDanmaku.API.Application.Services;

public class ScheduledCaptureConfig
{
    public int RoomId { get; set; }
    public int Duration { get; set; }
    public string StartTime { get; set; } = string.Empty;
}

public class ScheduleTaskService(
    ILogger<ScheduleTaskService> logger,
    IServiceScopeFactory serviceScopeFactory,
    IConfiguration configuration) : BackgroundService
{
    private const string ScheduledCaptureSection = "Douyu:ScheduledCapture:Tasks";
    private Timer? _timer;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.ZLogInformation($"ScheduleTaskService started");
        
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
        
        logger.ZLogInformation($"ScheduleTaskService stopped");
    }

    private void ScheduleNextRun()
    {
        var now = DateTimeOffset.UtcNow.ToLocalTime();
        var scheduledTasks = configuration.GetSection(ScheduledCaptureSection).Get<ScheduledCaptureConfig[]>();
        
        if (scheduledTasks is null || scheduledTasks.Length == 0)
        {
            logger.ZLogInformation($"No scheduled capture tasks configured");
            _timer?.Dispose();
            _timer = new Timer(async _ => await TriggerCaptureJobs(), null, TimeSpan.FromHours(1), TimeSpan.FromHours(1));
            return;
        }

        var nextRunTime = FindNextRunTime(now, scheduledTasks);
        var delay = nextRunTime - now;

        logger.ZLogInformation($"Scheduled task checker. Scheduling next run at {nextRunTime}");

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
            logger.ZLogWarning($"Invalid time format: {timeString}. Using default 10:00");
            return new TimeSpan(10, 0, 0);
        }
    }

    private async Task TriggerCaptureJobs()
    {
        try
        {
            logger.ZLogInformation($"Checking for scheduled capture jobs");
            
            var now = DateTimeOffset.UtcNow.ToLocalTime();
            var scheduledTasks = configuration.GetSection(ScheduledCaptureSection).Get<ScheduledCaptureConfig[]>();
            
            if (scheduledTasks is null || scheduledTasks.Length == 0)
            {
                logger.ZLogInformation($"No scheduled capture tasks configured");
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
                    logger.ZLogInformation($"Starting scheduled capture for room {task.RoomId} at {task.StartTime}");
                    
                    bool started;
                    using (var scope = serviceScopeFactory.CreateScope())
                    {
                        var captureJobManager = scope.ServiceProvider.GetRequiredService<ICaptureJobManager>();
                        started = await captureJobManager.StartAsync(task.RoomId, task.Duration);
                    }
                    
                    if (started)
                    {
                        logger.ZLogInformation($"Successfully started scheduled capture for room {task.RoomId} with duration {task.Duration}s");
                    }
                    else
                    {
                        logger.ZLogWarning($"Failed to start scheduled capture for room {task.RoomId}, possibly already running");
                    }
                }
            }
            
            ScheduleNextRun();
        }
        catch (Exception ex)
        {
            logger.ZLogError($"An error occurred while checking scheduled capture jobs. Exception: {ex}");
            
            ScheduleNextRun();
        }
    }

    public override void Dispose()
    {
        _timer?.Dispose();
        base.Dispose();
    }
}