using System.Globalization;

using CsvHelper;

using Microsoft.Extensions.Logging;

using ModernCSharp.Application.Abstractions;
using ModernCSharp.Application.Enums;
using ModernCSharp.Application.Models;
using ModernCSharp.Application.Models.FileExport;
using ModernCSharp.Application.Services.FileExport.Commands;

namespace ModernCSharp.Application.Services.FileExport.Handlers;

public class OrderCsvExportStrategy(ILogger<OrderCsvExportStrategy> logger, OrderService orderService) : IFileExportStrategy
{
    private OrderCsvExportContext _context;
    public List<FileType> FileTypes => [FileType.OrderCsv];

    public void InitializeContext(IFileExportContext context)
    {
        if (context is OrderCsvExportContext exportContext)
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

    private async Task PerformExportAsync(OrderCsvExportContext context, CancellationToken cancellationToken = default)
    {
        var orders = await orderService.GetOrdersAsync(cancellationToken);

        if (orders.Count == 0)
        {
            logger.LogInformation("No order to export.");
            return;
        }

        await using var stream = new FileStream(context.OutputPath, FileMode.Create, FileAccess.Write, FileShare.Read);
        await using var writer = new StreamWriter(stream);
        await using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        await csv.WriteRecordsAsync(orders, cancellationToken);
    }
}
