using Aether.DDD.Common;

namespace Aether.Ordering.Domain.Events;
public class OrderStatusChangedToStockConfirmedDomainEvent(int orderId) : BaseEvent
{
    public int OrderId
    {
        get;
    } = orderId;
}
