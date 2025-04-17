using ClosedXML.Excel;

using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.Domain.Entities;
using ModernCSharp.Infrastructure.Services.FileExport.Commands;

namespace ModernCSharp.Infrastructure.Services.FileExport.Handlers;

internal class OrderExcelExportStrategy(ILogger<OrderExcelExportStrategy> logger) : IFileExportStrategy<Order>
{
    private OrderExcelExportContext? _context;
    public List<FileType> FileTypes => [FileType.OrderExcel];

    public void Initialize(IFileExportContext<Order> context)
    {
        if (context is not OrderExcelExportContext exportContext)
        {
            throw new ArgumentException($"Invalid file export context. Expected {typeof(OrderExcelExportContext)}, but got {context.GetType()}.");
        }
        _context = exportContext;
    }

    public async Task<Result> ExportAsync(CancellationToken cancellationToken = default)
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
        if (_context!.DataToExport.Count == 0)
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
            currentRow.Cell("A").SetValue(order.Id);
            currentRow.Cell("B").SetValue(order.OrderStatus.ToString());
            currentRow.Cell("C").SetValue(order.Quantity);
            currentRow.Cell("D").SetValue(order.Total);
            currentRow.Cell("E").SetValue(order.OrderDate);
            currentRow.Cell("F").SetValue(order.CustomerName);

            contentRowIndex++;
        }

        wb.SaveAs(_context.OutputPath);

        return Task.CompletedTask;
    }
}
