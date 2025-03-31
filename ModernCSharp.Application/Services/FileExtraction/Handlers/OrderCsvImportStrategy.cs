using System.Globalization;

using CsvHelper;

using Microsoft.Extensions.Logging;

using ModernCSharp.Application.Abstractions;
using ModernCSharp.Application.Enums;
using ModernCSharp.Application.Models;
using ModernCSharp.Application.Models.FileExtraction;
using ModernCSharp.Application.Services.FileExtraction.Commands;

namespace ModernCSharp.Application.Services.FileExtraction.Handlers;

public class OrderCsvImportStrategy(ILogger<OrderCsvImportStrategy> logger) : IFileImportStrategy<Order>
{
    private OrderCsvImportContext _context;
    public List<FileType> FileTypes => [FileType.OrderCsv];

    public void InitializeContext(IFileImportContext context)
    {
        if (context is not OrderCsvImportContext importContext)
        {
            logger.LogError("Invalid file import context type.");
            throw new ArgumentException("Invalid file import context");
        }
        _context = importContext;
    }

    public async Task<ImportResult<Order>> ImportAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            var orders = await PerformImportAsync(_context, cancellationToken);
            return ImportResult<Order>.Success(orders);
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Import {FileType} operation was cancelled.", _context.FileType);
            return ImportResult<Order>.Failure(new("", $"Import {_context.FileType} operation  was cancelled."));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while importing orders from {@InputPath}.", _context.InputPath);
            return ImportResult<Order>.Failure(new("", $"An error occurred while importing orders from {_context.InputPath}."));
        }
    }

    private async Task<List<Order>> PerformImportAsync(OrderCsvImportContext context, CancellationToken cancellationToken = default)
    {
        await using var stream = new FileStream(context.InputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

        List<Order> orders = [];
        await foreach (var order in csv.GetRecordsAsync<Order>(cancellationToken))
        {
            orders.Add(order);
        }

        return orders;
    }
}
