namespace ModernCSharp.Ordering.Infrastructure.Services.FileContext.Strategy;
public class OrderCsvExportContextStrategy : IFileExportContextStrategy<Order>
{
    public FileType SupportedFileType => FileType.OrderCsv;
    public IFileExportContext<Order> CreateContext(string outputPath, IEnumerable<Order> data) => new OrderCsvExportContext(FileType.OrderCsv, outputPath, data);
}
