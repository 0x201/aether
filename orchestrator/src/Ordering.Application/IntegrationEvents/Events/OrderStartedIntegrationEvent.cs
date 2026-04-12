using Aether.EventBus.Events;

namespace Aether.Ordering.Application.IntegrationEvents.Events;

public record OrderStartedIntegrationEvent(string userId) : IntegrationEvent
{
    public string userId { get; set; } = userId;

}
