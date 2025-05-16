namespace ModernCSharp.Ordering.Infrastructure.Services.FileContext.Strategy;
public class OrderExcelImportContextStrategy : IFileImportContextStrategy
{
    public FileType SupportedFileType => FileType.OrderExcel;
    public IFileImportContext CreateContext(string outputPath) => new OrderExcelImportContext(FileType.OrderExcel, outputPath);
}
