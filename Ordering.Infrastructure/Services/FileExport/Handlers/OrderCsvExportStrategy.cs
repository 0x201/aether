using System.Globalization;

using CsvHelper;

using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.Infrastructure.Services.FileExport.Commands;

namespace ModernCSharp.Infrastructure.Services.FileExport.Handlers;

internal class OrderCsvExportStrategy(ILogger<OrderCsvExportStrategy> logger) : IFileExportStrategy<Order>
{
    private OrderCsvExportContext? _context;
    public List<FileType> FileTypes => [FileType.OrderCsv];

    public void Initialize(IFileExportContext<Order> context)
    {
        if (context is not OrderCsvExportContext exportContext)
        {
            throw new ArgumentException($"Invalid file export context. Expected {typeof(OrderCsvExportContext)}, but got {context.GetType()}.");
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

    private async Task PerformExportAsync(CancellationToken cancellationToken = default)
    {
        if (_context!.DataToExport.Count == 0)
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
