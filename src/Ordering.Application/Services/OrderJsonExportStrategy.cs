using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderJsonExportStrategy(ILogger<OrderJsonExportStrategy> logger) : FileExportStrategyBase<Order>(FileType.OrderJson)
{
    public override async Task<Result> ExportAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            await PerformExportAsync(cancellationToken);
            return Result.Success();
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Export {FileType} operation  was cancelled.", _context!.FileType);
            return Result.Failure([$"Export {_context.FileType} operation  was cancelled."]);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while exporting orders to {@OutputPath}.", _context!.OutputPath);
            return Result.Failure([$"An error occurred while generating order json file."]);
        }
    }

    private async Task PerformExportAsync(CancellationToken cancellationToken = default)
    {
        if (!_context!.DataToExport.Any())
        {
            logger.LogInformation("No order to export.");
            return;
        }

        var orderWrapper = new JsonWrapper<Order>(_context.DataToExport);
        using var stream = new FileStream(_context.OutputPath, FileMode.Create, FileAccess.Write, FileShare.Read);
        await JsonSerializer.SerializeAsync(stream, orderWrapper, JsonSerializationConstants.DefaultOptions, cancellationToken);
        await stream.FlushAsync(cancellationToken);
    }
}
