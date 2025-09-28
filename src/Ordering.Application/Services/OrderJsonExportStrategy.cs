using ModernCSharp.Shared.FileServices.Abstraction;
using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderJsonExportStrategy(ILogger<OrderJsonExportStrategy> logger) 
    : BaseOrderFileExportStrategy<Order>(logger, FileType.OrderJson)
{
    protected override async Task PerformExportAsync(IFileExportContext<Order> context, CancellationToken cancellationToken = default)
    {
        var orderWrapper = new JsonWrapper<Order>(context.DataToExport);
        using var stream = new FileStream(context.OutputPath, FileMode.Create, FileAccess.Write, FileShare.Read);
        await JsonSerializer.SerializeAsync(stream, orderWrapper, JsonSerializationConstants.DefaultOptions, cancellationToken);
        await stream.FlushAsync(cancellationToken);
    }
}
