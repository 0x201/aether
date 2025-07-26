using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderExcelImportStrategy(ILogger<OrderExcelImportStrategy> logger)
    : FileImportStrategyBase<Order>(FileType.OrderExcel)
{
    public override async Task<ImportResult<Order>> ImportAsync(CancellationToken cancellationToken = default)
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

        foreach (var row in ws.RowsUsed().Skip(1))
        {
            var orderNumber = row.Cell("A").GetValue<int>();
            var orderStatus = row.Cell("B").GetValue<string>();
            var quantity = row.Cell("C").GetValue<int>();
            var total = row.Cell("D").GetValue<decimal>();
            var date = row.Cell("E").GetValue<DateTime>();
            var username = row.Cell("F").GetValue<string>();


            var newOrder = new Order
            {
                ordernumber = orderNumber,
                status = orderStatus,
                quantity = quantity,
                total = total,
                date = date,
                username = username
            };

            orders.Add(newOrder);
        }

        return Task.FromResult(orders);
    }
}
