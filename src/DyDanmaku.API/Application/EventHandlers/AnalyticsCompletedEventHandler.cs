namespace DyDanmaku.API.Application.EventHandlers;

internal class AnalyticsCompletedEventHandler(
    ILogger<AnalyticsCompletedEventHandler> logger,
    IHubContext<DyDanmakuHub> hubContext
) : IIntegrationEventHandler<AnalyticsCompletedIntegrationEvent>
{
    public async Task Handle(AnalyticsCompletedIntegrationEvent @event)
    {
        logger.ZLogInformation($"Handling analytics completed event for room {@event.roomId}, completed at {@event.completedAt}");

        await hubContext.Clients.All.SendAsync("AnalyticsCompleted", new
        {
            @event.completedAt,
            @event.roomId,
            @event.frequenciesCount,
            @event.periodType,
            @event.startDate,
            @event.endDate
        });
        var roomInfo = @event.roomId.HasValue ? @event.roomId.ToString() : "All";
        logger.ZLogInformation($"Analytics completed notification sent to clients for room {roomInfo}");
    }
}
