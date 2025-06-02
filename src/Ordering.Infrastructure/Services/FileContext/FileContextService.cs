namespace ModernCSharp.Ordering.Infrastructure.Services.FileContext;

public interface IFileContextStrategy
{
    FileType SupportedFileType { get; }
    bool CanHandle(FileType fileType) => SupportedFileType == fileType;
}

public interface IFileExportContextStrategy<T> : IFileContextStrategy
{
    IFileExportContext<T> CreateContext(string outputPath, IEnumerable<T> data);
}

public interface IFileImportContextStrategy : IFileContextStrategy
{
    IFileImportContext CreateContext(string inputPath);
}


public class ExportContextFactory<T>(IEnumerable<IFileExportContextStrategy<T>> strategies)
{
    public IFileExportContext<T> CreateContext(FileType fileType, string outputPath, IEnumerable<T> dataToExport)
    {
        var strategy = strategies.FirstOrDefault(s => s.CanHandle(fileType));
        return strategy?.CreateContext(outputPath, dataToExport) ??
            throw new NotSupportedException($"Unsupported file type: {fileType}");
    }
}


public class ImportContextFactory(IEnumerable<IFileImportContextStrategy> strategies)
{
    public IFileImportContext CreateContext(FileType fileType, string inputPath)
    {
        var strategy = strategies.FirstOrDefault(s => s.CanHandle(fileType));
        return strategy?.CreateContext(inputPath) ??
            throw new NotSupportedException($"Unsupported file type: {fileType}");
    }
}
