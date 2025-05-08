using System.Globalization;

using CsvHelper;
using CsvHelper.Configuration;

using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Mappings;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.Infrastructure.Services.FileExtraction.Commands;

namespace ModernCSharp.Infrastructure.Services.FileExtraction.Handlers;

internal class OrderCsvImportStrategy(ILogger<OrderCsvImportStrategy> logger) : IFileImportStrategy<Order>
{
    private OrderCsvImportContext? _context;
    public List<FileType> FileTypes => [FileType.OrderCsv];

    public void Initialize(IFileImportContext context)
    {
        if (context is not OrderCsvImportContext importContext)
        {
            throw new ArgumentException($"Invalid file import context. Expected {typeof(OrderCsvImportContext)}, but got {context.GetType()}.");
        }
        _context = importContext;
    }

    public async Task<ImportResult<Order>> ImportAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            var orders = await PerformImportAsync(cancellationToken);
            return ImportResult<Order>.Success(orders);
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Import {FileType} operation was cancelled.", _context!.FileType);
            return ImportResult<Order>.Failure([$"Import {_context.FileType} operation  was cancelled."]);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while importing orders from {@InputPath}.", _context!.InputPath);
            return ImportResult<Order>.Failure([$"An error occurred while importing orders from {_context.InputPath}."]);
        }
    }

    private async Task<List<Order>> PerformImportAsync(CancellationToken cancellationToken = default)
    {
        await using var stream = new FileStream(_context!.InputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
        };
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, config);
        csv.Context.RegisterClassMap<OrderMapping>();

        List<Order> orders = [];
        await foreach (var order in csv.GetRecordsAsync<Order>(cancellationToken))
        {
            orders.Add(order);
        }

        return orders;
    }
}
