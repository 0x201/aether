namespace Aether.Ordering.Application.Commands;

public record CreateOrderCommand : IRequest<bool>
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
