using ModernCSharp.Shared.FileServices.Abstraction;
using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderExcelImportStrategy(ILogger<OrderExcelImportStrategy> logger)
    : BaseOrderFileImportStrategy(logger, FileType.OrderExcel)
{
    protected override Task<List<Order>> PerformImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        using var stream = new FileStream(context.InputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
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
