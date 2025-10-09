using System.Net.Http.Json;

namespace ModernCSharp.WinFormsApp;

public class OrderingApiClient(HttpClient httpClient)
{
    public async Task<OrderDto[]> GetOrdersAsync(CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<OrderDto[]>("/orders", cancellationToken);
    }
}
