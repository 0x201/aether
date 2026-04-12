using Aether.DDD.Common;
using Aether.Ordering.Domain.Aggregates.OrderAggregate;

namespace Aether.Ordering.Domain.Events;
public class OrderStatusChangedToAwaitingValidationDomainEvent : BaseEvent
{
    public int OrderId
    {
        get;
    }
    public IEnumerable<OrderItem> OrderItems
    {
        get;
    }

    public OrderStatusChangedToAwaitingValidationDomainEvent(int orderId,
        IEnumerable<OrderItem> orderItems)
    {
        OrderId = orderId;
        OrderItems = orderItems;
    }
}
