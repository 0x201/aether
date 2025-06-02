using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.DDD.Common;

namespace ModernCSharp.Ordering.Domain.Events;

public class OrderCreatedEvent(Order order) : BaseEvent
{
    public Order Order
    {
        get;
        set;
    } = order;
}
