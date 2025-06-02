using Microsoft.Extensions.Logging;
using ModernCSharp.EventBus.Abstractions;
using ModernCSharp.EventBus.Events;
using ModernCSharp.IntegrationEventLogEF.Services;
using ModernCSharp.Ordering.Infrastructure;

namespace ModernCSharp.Ordering.Application.IntegrationEvents;

public class OrderingIntegrationEventService(
    IEventBus eventBus,
    OrderingDbContext orderingDbContext,
    IIntegrationEventLogService integrationEventLogService,
    ILogger<OrderingIntegrationEventService> logger
) : IOrderingIntegrationEventService
{
    private readonly IEventBus _eventBus = eventBus ?? throw new ArgumentNullException(nameof(eventBus));
    private readonly OrderingDbContext _orderingDbContext = orderingDbContext ?? throw new ArgumentNullException(nameof(orderingDbContext));
    private readonly IIntegrationEventLogService _eventLogService = integrationEventLogService ?? throw new ArgumentNullException(nameof(integrationEventLogService));
    private readonly ILogger<OrderingIntegrationEventService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task AddAndSaveEventAsync(IntegrationEvent @event)
    {
        _logger.LogInformation("Enqueuing integration event: {IntegrationEventId} to repository ({@IntegrationEvent})", @event.Id, @event);
        await _eventLogService.SaveEventAsync(@event, _orderingDbContext.GetCurrentTransaction());
    }

    public async Task PublishEventsThroughEventBusAsync(Guid transactionId)
    {
        var pendingLogEvents = await _eventLogService.RetrieveEventLogsPendingToPublishAsync(transactionId);

        foreach (var logEvent in pendingLogEvents)
        {
            _logger.LogInformation("Publishing integration event: {IntegrationEventId} - ({@IntegrationEvent})", logEvent.EventId, logEvent);

            try
            {
                await _eventLogService.MarkEventAsInProgressAsync(logEvent.EventId);
                await _eventBus.PublishAsync(logEvent.IntegrationEvent);
                await _eventLogService.MarkEventAsPublishedAsync(logEvent.EventId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing integration event: {IntegrationEventId}", logEvent.EventId);
                await _eventLogService.MarkEventAsFailedAsync(logEvent.EventId);
            }

        }
    }
}
