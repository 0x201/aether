using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderCsvExportStrategy(ILogger<OrderCsvExportStrategy> logger)
    : FileExportStrategyBase<Order>(FileType.OrderCsv)
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
            return Result.Failure([$"An error occurred while exporting orders to {_context.OutputPath}."]);
        }
    }

    private async Task PerformExportAsync(CancellationToken cancellationToken = default)
    {
        if (!_context!.DataToExport.Any())
        {
            logger.LogInformation("No order to export.");
            return;
        }

        await using var stream = new FileStream(_context.OutputPath, FileMode.Create, FileAccess.Write, FileShare.Read);
        await using var writer = new StreamWriter(stream);
        await using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        await csv.WriteRecordsAsync(_context.DataToExport, cancellationToken);
    }
}
