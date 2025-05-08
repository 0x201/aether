using ModernCSharp.DDD.Common;

namespace ModernCSharp.Inventory.Domain.Aggregates.ProductAggregate;

public class Sku : BaseAuditableEntity<int>
{
    public string Name
    {
        get;
        set;
    }

    public decimal UnitPrice
    {
        get;
        set;
    }

}
