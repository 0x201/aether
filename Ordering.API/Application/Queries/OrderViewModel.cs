namespace ModernCSharp.ApiService.Application.Queries;

public record Order
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
    public decimal quantity
    {
        get;
        set;
    }
    public decimal total
    {
        get; set;
    }
}
