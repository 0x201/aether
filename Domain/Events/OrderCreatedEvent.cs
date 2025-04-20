using ModernCSharp.Domain.Common;
using ModernCSharp.Domain.Entities;

namespace ModernCSharp.Domain.Events;
public class OrderCreatedEvent(Order order) : BaseEvent
{
    public Order Order
    {
        get;
        set;
    } = order;
}
