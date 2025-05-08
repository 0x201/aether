using ModernCSharp.DDD.Common;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.Ordering.Domain.Events;
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
