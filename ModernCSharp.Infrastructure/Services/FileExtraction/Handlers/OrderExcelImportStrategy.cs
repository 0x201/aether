using ClosedXML.Excel;

using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.Domain.Entities;
using ModernCSharp.Domain.Enums;
using ModernCSharp.Infrastructure.Services.FileExtraction.Commands;

namespace ModernCSharp.Infrastructure.Services.FileExtraction.Handlers;

internal class OrderExcelImportStrategy(ILogger<OrderExcelImportStrategy> logger) : IFileImportStrategy<Order>
{
    private OrderExcelImportContext? _context;

    public List<FileType> FileTypes => [FileType.OrderExcel];

    public void Initialize(IFileImportContext context)
    {
        if (context is not OrderExcelImportContext importContext)
        {
            throw new ArgumentException($"Invalid file import context. Expected {typeof(OrderExcelImportContext)}, but got {context.GetType()}.");
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
            logger.LogError("Import {FileType} operation  was cancelled.", _context!.FileType);
            return ImportResult<Order>.Failure([$"Import {_context.FileType} operation  was cancelled."]);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while importing orders from {@InputPath}.", _context!.InputPath);
            return ImportResult<Order>.Failure([$"An error occurred while importing orders from {_context.InputPath}."]);
        }
    }

    private Task<List<Order>> PerformImportAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        using var stream = new FileStream(_context!.InputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var wb = new XLWorkbook(stream);
        var ws = wb.Worksheet(1);

        List<Order> orders = [];

        foreach (var row in ws.RowsUsed())
        {
            var valueOfCellA = row.Cell("A").GetValue<string>();
            if (valueOfCellA == "Id")
            {
                continue;
            }
            var orderStatusStr = row.Cell("B").GetValue<string>();
            if (!Enum.TryParse(orderStatusStr, out OrderStatus orderStatus))
            {
                logger.LogWarning("Invalid order status found in {FilePath}.", _context.InputPath);
                continue;
            }

            var newOrder = new Order
            {
                Id = row.Cell("A").GetValue<int>(),
                OrderStatus = orderStatus,
                Quantity = row.Cell("C").GetValue<int>(),
                Total = row.Cell("D").GetValue<int>(),
                OrderDate = row.Cell("E").GetValue<DateTime>(),
                CustomerName = row.Cell("F").GetValue<string>(),
            };

            orders.Add(newOrder);
        }

        return Task.FromResult(orders);
    }
}
