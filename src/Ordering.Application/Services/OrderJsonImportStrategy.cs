using ModernCSharp.Shared.FileServices.Abstraction;
using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderJsonImportStrategy(ILogger<OrderJsonImportStrategy> logger) 
    : BaseOrderFileImportStrategy(logger, FileType.OrderJson)
{
    protected override async Task<List<Order>> PerformImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        using var stream = new FileStream(context.InputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var orderWrapper = await JsonSerializer.DeserializeAsync<JsonWrapper<Order>>(stream, JsonSerializationConstants.DefaultOptions, cancellationToken);

        return [.. orderWrapper!.Items];
    }
}
