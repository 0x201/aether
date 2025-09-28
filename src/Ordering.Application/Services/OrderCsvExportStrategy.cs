using ModernCSharp.Shared.FileServices.Abstraction;
using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public class OrderCsvExportStrategy(ILogger<OrderCsvExportStrategy> logger)
    : BaseOrderFileExportStrategy<Order>(logger, FileType.OrderCsv)
{
    protected override async Task PerformExportAsync(IFileExportContext<Order> context, CancellationToken cancellationToken = default)
    {
        await using var stream = new FileStream(context.OutputPath, FileMode.Create, FileAccess.Write, FileShare.Read);
        await using var writer = new StreamWriter(stream);
        await using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        await csv.WriteRecordsAsync(context.DataToExport, cancellationToken);
    }
}
