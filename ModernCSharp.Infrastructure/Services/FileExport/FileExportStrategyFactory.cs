using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;

namespace ModernCSharp.Infrastructure.Services.FileExport;

public interface IFileExportStrategy<T>
{
    List<FileType> FileTypes
    {
        get;
    }
    void InitializeContext(IFileExportContext<T> context);
    Task<IResult> ExportAsync(CancellationToken cancellationToken = default);
    bool CanExport(FileType fileType) => FileTypes.Contains(fileType);
}

public interface IFileExportStrategyFactory<T>
{
    IFileExportStrategy<T> GetStrategy(IFileExportContext<T> context);
}

public class FileExportStrategyFactory<T>(IEnumerable<IFileExportStrategy<T>> strategies) : IFileExportStrategyFactory<T>
{
    public IFileExportStrategy<T> GetStrategy(IFileExportContext<T> context)
    {
        var strategy = strategies.FirstOrDefault(x => x.CanExport(context.FileType)) ??
         throw new NotImplementedException($"Cannot find the implementation of {nameof(IFileExportStrategyFactory<T>)} for {context.FileType}");

        strategy.InitializeContext(context);
        return strategy;
    }
}