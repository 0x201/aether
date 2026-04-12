
namespace Aether.Shared.FileServices;

public class FileProcessingService<T>(
    IFileImportStrategyFactory<T> importStrategyFactory,
    IFileExportStrategyFactory<T> exportStrategyFactory) : IFileProcessingService<T>
{
    private readonly IFileImportStrategyFactory<T> _importStrategyFactory = importStrategyFactory;
    private readonly IFileExportStrategyFactory<T> _exportStrategyFactory = exportStrategyFactory;

    public async Task<Result> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default)
    {
        var strategy = _exportStrategyFactory.GetStrategy(context.FileType);
        return await strategy.ExportAsync(context, cancellationToken);
    }

    public async Task<ImportResult<T>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        var strategy = _importStrategyFactory.GetStrategy(context.FileType);
        return await strategy.ImportAsync(context, cancellationToken);
    }
}