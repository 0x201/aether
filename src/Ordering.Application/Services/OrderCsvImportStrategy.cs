using ModernCSharp.Shared.FileServices.Abstraction;
using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderCsvImportStrategy(ILogger<OrderCsvImportStrategy> logger)
    : BaseOrderFileImportStrategy(logger, FileType.OrderCsv)
{
    protected override async Task<List<Order>> PerformImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        await using var stream = new FileStream(context.InputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
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
