using ModernCSharp.DDD.Common;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.Ordering.Domain.Events;
public class OrderShippedDomainEvent(Order order) : BaseEvent
{
    public Order Order
    {
        get;
    } = order;
}
