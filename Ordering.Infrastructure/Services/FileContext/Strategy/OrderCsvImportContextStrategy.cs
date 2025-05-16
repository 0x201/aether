namespace ModernCSharp.Ordering.Infrastructure.Services.FileContext.Strategy;
public class OrderCsvImportContextStrategy : IFileImportContextStrategy
{
    public FileType SupportedFileType => FileType.OrderCsv;

    public IFileImportContext CreateContext(string outputPath) => new OrderCsvImportContext(FileType.OrderCsv, outputPath);
}
