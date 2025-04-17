using ModernCSharp.Domain.Common;
using ModernCSharp.Domain.Enums;

namespace ModernCSharp.Domain.Entities;

public class Order : BaseAuditableEntity<int>
{
    public OrderStatus OrderStatus
    {
        get;
        set;
    }

    public int Quantity
    {
        get;
        set;
    }
    public decimal Total
    {
        get;
        set;
    }
    public required string CustomerName
    {
        get;
        set;
    }
    public DateTime OrderDate
    {
        get;
        set;
    }
}
