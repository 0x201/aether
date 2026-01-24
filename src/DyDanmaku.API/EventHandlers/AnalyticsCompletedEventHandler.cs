namespace DyDanmaku.Application.EventHandlers;

internal class AnalyticsCompletedEventHandler(
    ILogger<AnalyticsCompletedEventHandler> logger,
    IHubContext<DyDanmakuHub> hubContext
) : IIntegrationEventHandler<AnalyticsCompletedIntegrationEvent>
{
    public async Task Handle(AnalyticsCompletedIntegrationEvent @event)
    {
        logger.LogInformation("Handling analytics completed event for room {RoomId}, completed at {CompletedAt}", 
                @event.RoomId, @event.CompletedAt);

        await hubContext.Clients.All.SendAsync("AnalyticsCompleted", new
        {
            @event.CompletedAt,
            @event.RoomId,
            @event.FrequenciesCount,
            @event.PeriodType,
            @event.StartDate,
            @event.EndDate
        });

        logger.LogInformation("Analytics completed notification sent to clients for room {RoomId}", @event.RoomId);
    }
}
