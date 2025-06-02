using ModernCSharp.EventBus.Events;

namespace ModernCSharp.Ordering.Application.IntegrationEvents;

public interface IOrderingIntegrationEventService
{
    Task PublishEventsThroughEventBusAsync(Guid transactionId);
    Task AddAndSaveEventAsync(IntegrationEvent @event);
}
