using Aether.DDD.Common;
using Aether.Ordering.Domain.Aggregates.OrderAggregate;

namespace Aether.Ordering.Domain.Events;
public class OrderShippedDomainEvent(Order order) : BaseEvent
{
    public Order Order
    {
        get;
    } = order;
}
