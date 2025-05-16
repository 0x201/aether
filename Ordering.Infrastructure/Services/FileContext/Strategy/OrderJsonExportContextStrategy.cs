namespace ModernCSharp.Ordering.Infrastructure.Services.FileContext.Strategy;
public class OrderJsonExportContextStrategy : IFileExportContextStrategy<Order>
{
    public FileType SupportedFileType => FileType.OrderJson;
    public IFileExportContext<Order> CreateContext(string outputPath, IEnumerable<Order> data) => new OrderCsvExportContext(FileType.OrderJson, outputPath, data);
}
