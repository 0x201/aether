using Aether.EventBus.Events;

namespace Aether.Ordering.Application.IntegrationEvents;

public interface IOrderingIntegrationEventService
{
    Task PublishEventsThroughEventBusAsync(Guid transactionId, CancellationToken cancellationToken = default);
    Task AddAndSaveEventAsync(IntegrationEvent @event);
}
