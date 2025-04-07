using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExtraction;

namespace ModernCSharp.Infrastructure.Services.FileExtraction;

public interface IFileImportStrategy<T>
{
    List<FileType> FileTypes
    {
        get;
    }
    void Initialize(IFileImportContext context);
    Task<ImportResult<T>> ImportAsync(CancellationToken cancellationToken = default);
    bool CanImport(FileType fileType) => FileTypes.Contains(fileType);
}

public interface IFileImportStrategyFactory<T>
{
    IFileImportStrategy<T> GetStrategy(IFileImportContext context);
}

internal class FileImportStrategyFactory<T>(IEnumerable<IFileImportStrategy<T>> strategies) : IFileImportStrategyFactory<T>
{
    public IFileImportStrategy<T> GetStrategy(IFileImportContext context)
    {
        var strategy = strategies.FirstOrDefault(x => x.CanImport(context.FileType)) ??
            throw new NotSupportedException($"Cannot find the implementation of {nameof(IFileImportStrategy<T>)} for {context.FileType}");

        strategy.Initialize(context);
        return strategy;
    }
}
