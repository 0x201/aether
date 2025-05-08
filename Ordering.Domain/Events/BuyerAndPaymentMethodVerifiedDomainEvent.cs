using ModernCSharp.DDD.Common;
using ModernCSharp.Ordering.Domain.Aggregates.BuyerAggregate;

namespace ModernCSharp.Ordering.Domain.Events;

public class BuyerAndPaymentMethodVerifiedDomainEvent(Buyer buyer, PaymentMethod payment, int orderId) : BaseEvent
{
    public Buyer Buyer
    {
        get; private set;
    } = buyer;
    public PaymentMethod Payment
    {
        get; private set;
    } = payment;
    public int OrderId
    {
        get; private set;
    } = orderId;
}
