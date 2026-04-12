namespace Aether.Ordering.Application.Queries;

public record OrderDto
{
    public int ordernumber
    {
        get; init;
    }
    public DateTime date
    {
        get; init;
    }
    public string status
    {
        get; init;
    }
    public int quantity
    {
        get;
        set;
    }
    public decimal total
    {
        get; set;
    }
    public string username { get; set; }
}
