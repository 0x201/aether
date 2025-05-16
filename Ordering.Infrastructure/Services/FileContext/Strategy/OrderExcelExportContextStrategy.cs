namespace ModernCSharp.Ordering.Infrastructure.Services.FileContext.Strategy;
public class OrderExcelExportContextStrategy : IFileExportContextStrategy<Order>
{
    public FileType SupportedFileType => FileType.OrderExcel;
    public IFileExportContext<Order> CreateContext(string outputPath, IEnumerable<Order> data) => new OrderCsvExportContext(FileType.OrderExcel, outputPath, data);
}
