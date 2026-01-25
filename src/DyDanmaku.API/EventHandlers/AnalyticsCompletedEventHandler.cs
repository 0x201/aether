namespace DyDanmaku.Application.EventHandlers;

internal class AnalyticsCompletedEventHandler(
    ILogger<AnalyticsCompletedEventHandler> logger,
    IHubContext<DyDanmakuHub> hubContext
) : IIntegrationEventHandler<AnalyticsCompletedIntegrationEvent>
{
    public async Task Handle(AnalyticsCompletedIntegrationEvent @event)
    {
        logger.LogInformation("Handling analytics completed event for room {RoomId}, completed at {CompletedAt}", 
                @event.roomId, @event.completedAt);

        await hubContext.Clients.All.SendAsync("AnalyticsCompleted", new
        {
            @event.completedAt,
            @event.roomId,
            @event.frequenciesCount,
            @event.periodType,
            @event.startDate,
            @event.endDate
        });

        logger.LogInformation("Analytics completed notification sent to clients for room {RoomId}", @event.roomId.HasValue ? @event.roomId : "All");
    }
}
