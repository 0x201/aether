using ModernCSharp.EventBus.Events;

namespace ModernCSharp.Ordering.Application.IntegrationEvents.Events;

public record OrderStartedIntegrationEvent(string userId) : IntegrationEvent
{
    public string userId { get; set; } = userId;

}
