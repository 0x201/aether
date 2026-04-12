namespace Aether.Ordering.Application.Services;

public class OrderJsonImportStrategy(ILogger<OrderJsonImportStrategy> logger) 
    : BaseOrderFileImportStrategy(logger, FileType.OrderJson)
{
    protected override async Task<List<OrderDto>> PerformImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        using var stream = new FileStream(context.InputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var orderWrapper = await JsonSerializer.DeserializeAsync<JsonWrapper<OrderDto>>(stream, JsonSerializationConstants.DefaultOptions, cancellationToken);

        return [.. orderWrapper!.Items];
    }
}
