namespace ModernCSharp.Web.Services;

public class OrderingService(HttpClient httpClient)
{
    private readonly string _serviceBaseUrl = "/api/Orders/";

    public Task<OrderRecord[]> GetOrders()
    {
        return httpClient.GetFromJsonAsync<OrderRecord[]>(_serviceBaseUrl)!;
    }

    //public Task CreateOrder(CreateOrderRequest request, Guid requestId)
    //{

    //}
}

public record OrderRecord(int OrderNumber, DateTime Date, string Status, decimal Total);
