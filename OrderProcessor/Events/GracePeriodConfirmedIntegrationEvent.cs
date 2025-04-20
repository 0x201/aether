using ModernCSharp.EventBus.Events;

namespace ModernCSharp.OrderProcessor.Events;

public record GracePeriodConfirmedIntegrationEvent(int OrderId) : IntegrationEvent
{
    public int OrderId
    {
        get;
    } = OrderId;
}