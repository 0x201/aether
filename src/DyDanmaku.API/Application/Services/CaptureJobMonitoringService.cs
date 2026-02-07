namespace DyDanmaku.API.Application.Services;

public class CaptureJobMonitoringService(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<CaptureJobMonitoringService> logger) : BackgroundService
{
    private const string GracePeriodTimeSection = "Douyu:GracePeriodTime";
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.ZLogInformation($"CaptureJobMonitoringService started");

        var gracePeriodTime = configuration.GetSection(GracePeriodTimeSection).Get<int>();

        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = serviceProvider.CreateAsyncScope();

            var jobManager = scope.ServiceProvider.GetRequiredService<ICaptureJobManager>();
            var jobService = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();

            await ProcessExpiredJobs(jobManager, jobService);

            await Task.Delay(TimeSpan.FromMinutes(gracePeriodTime), stoppingToken);
        }
    }

    private async Task ProcessExpiredJobs(ICaptureJobManager jobManager, ICaptureJobRepository jobService)
    {
        var expiredJobs = await jobService.GetExpiredJobsAsync();

        foreach (var job in expiredJobs)
        {
            await jobManager.StopAsync(job.RoomId);
            logger.ZLogInformation($"Stopped expired capture job for room {job.RoomId}");
        }
    }
}