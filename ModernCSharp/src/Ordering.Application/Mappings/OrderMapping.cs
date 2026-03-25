namespace ModernCSharp.Ordering.Application.Mappings;

public class OrderMapping : ClassMap<Order>
{
    public OrderMapping()
    {
        Map(x => x.CreatedAt).Ignore();
        Map(x => x.CreatedBy).Ignore();
        Map(x => x.LastModifiedAt).Ignore();
        Map(x => x.LastModifiedBy).Ignore();
        Map(x => x.DomainEvents).Ignore();

        Map(x => x.Id);
        Map(x => x.OrderStatus);
        Map(x => x.OrderDate);
        Map(x => x.Quantity);
        Map(x => x.Total);
        Map(x => x.CustomerName);
    }
}
