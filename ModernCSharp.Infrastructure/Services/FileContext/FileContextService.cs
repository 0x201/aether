using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.ApplicationCore.Models.FileExtraction;

namespace ModernCSharp.Infrastructure.Services.FileContext;

public interface IFileExportContextStrategy<T>
{
    bool CanHandle(FileType fileType);
    IFileExportContext<T> CreateContext(string outputPath, List<T> data);
}

public class ExportContextFactory<T>(IEnumerable<IFileExportContextStrategy<T>> strategies)
{
    public IFileExportContext<T> CreateContext(FileType fileType, string outputPath, List<T> dataToExport)
    {
        var strategy = strategies.FirstOrDefault(s => s.CanHandle(fileType));
        return strategy?.CreateContext(outputPath, dataToExport) ??
            throw new NotSupportedException($"Unsupported file type: {fileType}");
    }
}

public interface IFileImportContextStrategy
{
    bool CanHandle(FileType fileType);
    IFileImportContext CreateContext(string inputPath);
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