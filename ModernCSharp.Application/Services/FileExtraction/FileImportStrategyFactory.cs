using ModernCSharp.Application.Abstractions;
using ModernCSharp.Application.Models.FileExtraction;

namespace ModernCSharp.Application.Services.FileExtraction;

public interface IFileImportStrategyFactory<T>
{
    IFileImportStrategy<T> GetStrategy(IFileImportContext context);
}

public class FileImportStrategyFactory<T>(IEnumerable<IFileImportStrategy<T>> strategies) : IFileImportStrategyFactory<T>
{
    public IFileImportStrategy<T> GetStrategy(IFileImportContext context)
    {
        var strategy = strategies.FirstOrDefault(x => x.CanImport(context.FileType)) ??
            throw new NotSupportedException($"Cannot find the implementation of {nameof(IFileImportStrategy<T>)} for {context.FileType}");

        strategy.InitializeContext(context);
        return strategy;
    }
}
