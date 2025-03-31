using ClosedXML.Excel;

using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.ApplicationCore.Services.FileExport.Commands;

namespace ModernCSharp.ApplicationCore.Services.FileExport.Handlers;

public class OrderExcelExportStrategy(ILogger<OrderExcelExportStrategy> logger, OrderService orderService) : IFileExportStrategy
{
    private OrderExcelExportContext _context;
    public List<FileType> FileTypes => [FileType.OrderExcel];

    public void InitializeContext(IFileExportContext context)
    {
        if (context is OrderExcelExportContext exportContext)
        {
            _context = exportContext;
        }
        else
        {
            throw new ArgumentException("Invalid file export context");
        }
    }

    public async Task<IResult> ExportAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            await PerformExportAsync(_context, cancellationToken);
            return Result.Success();
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Export {FileType} operation  was cancelled.", _context.FileType);
            return Result.Failure(new("", $"Export {_context.FileType} operation  was cancelled."));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while exporting orders to {@OutputPath}.", _context.OutputPath);
            return Result.Failure(new("", $"An error occurred while exporting orders to {_context.OutputPath}."));
        }
    }
    private async Task PerformExportAsync(OrderExcelExportContext context, CancellationToken cancellationToken = default)
    {
        var orders = await orderService.GetOrdersAsync(cancellationToken);

        if (orders.Count == 0)
        {
            logger.LogInformation("No order to export.");
            return;
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
        foreach (var order in orders)
        {
            var currentRow = ws.Row(contentRowIndex);
            currentRow.Cell("A").SetValue(order.Id);
            currentRow.Cell("B").SetValue(order.OrderStatus.ToString());
            currentRow.Cell("C").SetValue(order.Quantity);
            currentRow.Cell("D").SetValue(order.Total);

            contentRowIndex++;
        }

        wb.SaveAs(_context.OutputPath);
    }
}
