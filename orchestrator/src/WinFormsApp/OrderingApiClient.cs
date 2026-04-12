using System.Net.Http.Json;

namespace Aether.WinFormsApp;

public class OrderingApiClient(HttpClient httpClient)
{
    public async Task<OrderDto[]> GetOrdersAsync(CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<OrderDto[]>("/orders", cancellationToken);
    }
}
