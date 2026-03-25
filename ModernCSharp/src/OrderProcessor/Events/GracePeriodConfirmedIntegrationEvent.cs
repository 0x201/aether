namespace ModernCSharp.Ordering.OrderProcessor.Events;

public record GracePeriodConfirmedIntegrationEvent(int OrderId) : IntegrationEvent
{
    public int OrderId
    {
        get;
    } = OrderId;
}
