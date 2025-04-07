using ModernCSharp.ApplicationCore.Enums;

namespace ModernCSharp.ApplicationCore.Models;

public class Order
{
    public int Id
    {
        get;
        set;
    }
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
    public string CustomerName
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
