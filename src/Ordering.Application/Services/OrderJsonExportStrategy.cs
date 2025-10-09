namespace ModernCSharp.Ordering.Application.Services;

public class OrderJsonExportStrategy(ILogger<OrderJsonExportStrategy> logger) 
    : BaseOrderFileExportStrategy<OrderDto>(logger, FileType.OrderJson)
{
    protected override async Task PerformExportAsync(IFileExportContext<OrderDto> context, CancellationToken cancellationToken = default)
    {
        var orderWrapper = new JsonWrapper<OrderDto>(context.DataToExport);
        using var stream = new FileStream(context.OutputPath, FileMode.Create, FileAccess.Write, FileShare.Read);
        await JsonSerializer.SerializeAsync(stream, orderWrapper, JsonSerializationConstants.DefaultOptions, cancellationToken);
        await stream.FlushAsync(cancellationToken);
    }
}
