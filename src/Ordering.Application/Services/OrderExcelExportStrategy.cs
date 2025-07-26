using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderExcelExportStrategy(ILogger<OrderExcelExportStrategy> logger) : FileExportStrategyBase<Order>(FileType.OrderExcel)
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

    private Task PerformExportAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!_context!.DataToExport.Any())
        {
            logger.LogInformation("No order to export.");
            return Task.CompletedTask;
        }

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Worksheet 1");

        var headerRow = ws.Row(1);
        var properties = typeof(Order).GetProperties();

        var headerCellIndex = 1;
        foreach (var property in properties)
        {
            headerRow.Cell(headerCellIndex).SetValue(property.Name);
            headerCellIndex++;
        }

        var contentRowIndex = 2;
        foreach (var order in _context.DataToExport)
        {
            var currentRow = ws.Row(contentRowIndex);
            currentRow.Cell("A").SetValue(order.ordernumber);
            currentRow.Cell("B").SetValue(order.status);
            currentRow.Cell("C").SetValue(order.quantity);
            currentRow.Cell("D").SetValue(order.total);
            currentRow.Cell("E").SetValue(order.date);
            currentRow.Cell("F").SetValue(order.username);

            contentRowIndex++;
        }

        wb.SaveAs(_context.OutputPath);

        return Task.CompletedTask;
    }
}
