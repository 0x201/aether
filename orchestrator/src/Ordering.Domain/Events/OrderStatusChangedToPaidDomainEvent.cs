using Aether.DDD.Common;
using Aether.Ordering.Domain.Aggregates.OrderAggregate;

namespace Aether.Ordering.Domain.Events;
public class OrderStatusChangedToPaidDomainEvent : BaseEvent
{
    public int OrderId
    {
        get;
    }
    public IEnumerable<OrderItem> OrderItems
    {
        get;
    }

    public OrderStatusChangedToPaidDomainEvent(int orderId,
        IEnumerable<OrderItem> orderItems)
    {
        OrderId = orderId;
        OrderItems = orderItems;
    }
}
