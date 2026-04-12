using Aether.DDD.Common;
using Aether.Ordering.Domain.Aggregates.OrderAggregate;

namespace Aether.Ordering.Domain.Events;

public class OrderCancelledDomainEvent(Order order) : BaseEvent
{
    public Order Order
    {
        get;
    } = order;
}
