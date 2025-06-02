namespace ModernCSharp.Ordering.Infrastructure.Services.FileContext.Strategy;
public class OrderJsonImportContextStrategy : IFileImportContextStrategy
{
    public FileType SupportedFileType => FileType.OrderJson;
    public IFileImportContext CreateContext(string outputPath) => new OrderJsonImportContext(FileType.OrderJson, outputPath);
}
