using System.Net.Http.Json;

namespace ModernCSharp.WinFormsApp;

public class OrderingApiClient(HttpClient httpClient)
{
    public async Task<Order[]> GetOrdersAsync(CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<Order[]>("/orders", cancellationToken);
    }
}
