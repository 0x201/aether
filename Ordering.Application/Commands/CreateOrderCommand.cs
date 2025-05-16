namespace ModernCSharp.Ordering.Application.Commands;

public record CreateOrderCommand : IRequest<int>
{
    public OrderStatus OrderStatus
    {
        get;
        set;
    }
    public decimal Total
    {
        get;
        set;
    }
    public int Quantity
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
