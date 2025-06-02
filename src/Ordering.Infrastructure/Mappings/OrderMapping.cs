namespace ModernCSharp.Ordering.Domain.Mappings;
public class OrderMapping : ClassMap<Order>
{
    public OrderMapping()
    {
        Map(x => x.Created).Ignore();
        Map(x => x.CreatedBy).Ignore();
        Map(x => x.LastModified).Ignore();
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
