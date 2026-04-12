using Aether.DDD.Common;
using Aether.Ordering.Domain.Aggregates.OrderAggregate;

namespace Aether.Ordering.Domain.Events;

public class OrderCreatedEvent(Order order) : BaseEvent
{
    public Order Order
    {
        get;
        set;
    } = order;
}
