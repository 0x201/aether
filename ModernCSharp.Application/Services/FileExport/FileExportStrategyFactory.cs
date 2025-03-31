using ModernCSharp.Application.Abstractions;
using ModernCSharp.Application.Models.FileExport;

namespace ModernCSharp.Application.Services.FileExport;

public interface IFileExportStrategyFactory
{
    IFileExportStrategy GetStrategy(IFileExportContext context);
}

public class FileExportStrategyFactory(IEnumerable<IFileExportStrategy> strategies) : IFileExportStrategyFactory
{
    public IFileExportStrategy GetStrategy(IFileExportContext context)
    {
        var strategy = strategies.FirstOrDefault(x => x.CanExport(context.FileType)) ??
         throw new NotImplementedException($"Cannot find the implementation of {nameof(IFileExportStrategy)} for {context.FileType}");
        
        strategy.InitializeContext(context);
        return strategy;
    }
}