using ModernCSharp.DDD.Common;

namespace ModernCSharp.Ordering.Domain.Events;
public class OrderStatusChangedToStockConfirmedDomainEvent(int orderId) : BaseEvent
{
    public int OrderId
    {
        get;
    } = orderId;
}
