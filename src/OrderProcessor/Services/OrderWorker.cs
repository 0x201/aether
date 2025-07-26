using OrderStatus = ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate.OrderStatus;

namespace ModernCSharp.Ordering.OrderProcessor.Services;


public class OrderWorker(
    ILogger<OrderWorker> logger,
    IEventBus eventBus,
    IServiceScopeFactory serviceScopeFactory,
    IOptions<BackgroundTaskOptions> options) : BackgroundService
{
    private readonly BackgroundTaskOptions
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));

    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var delayTime = TimeSpan.FromSeconds(_options.CheckUpdateTime);

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("GracePeriodManagerService is starting.");
            stoppingToken.Register(() => logger.LogDebug("GracePeriodManagerService background task is stopping."));
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("GracePeriodManagerService background task is doing background work.");
            }

            await CheckConfirmedGracePeriodOrders();

            await Task.Delay(delayTime, stoppingToken);
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("GracePeriodManagerService background task is stopping.");
        }
    }

    private async Task CheckConfirmedGracePeriodOrders()
    {
        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Checking confirmed grace period orders");
        }

        var orderIds = await GetConfirmedGracePeriodOrders();

        foreach (var orderId in orderIds)
        {
            var confirmGracePeriodEvent = new GracePeriodConfirmedIntegrationEvent(orderId);

            logger.LogInformation("Publishing integration event: {IntegrationEventId} - ({@IntegrationEvent})",
                confirmGracePeriodEvent.Id, confirmGracePeriodEvent);

            await eventBus.PublishAsync(confirmGracePeriodEvent);
        }
    }

    private async ValueTask<List<int>> GetConfirmedGracePeriodOrders()
    {
        using var scope = serviceScopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<OrderingDbContext>();

        var timespan = DateTime.UtcNow.AddMinutes(_options.GracePeriodTime);

        var ids = await dbContext.Orders
            .Where(x => x.OrderStatus == OrderStatus.Submitted && x.OrderDate >= timespan)
            .Select(x => x.Id)
            .ToListAsync();

        return ids;
    }
}
