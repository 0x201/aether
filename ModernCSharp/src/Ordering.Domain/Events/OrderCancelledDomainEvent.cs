using ModernCSharp.DDD.Common;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.Ordering.Domain.Events;

public class OrderCancelledDomainEvent(Order order) : BaseEvent
{
    public Order Order
    {
        get;
    } = order;
}
