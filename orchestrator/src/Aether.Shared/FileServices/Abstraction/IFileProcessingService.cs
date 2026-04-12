namespace Aether.Shared.FileServices.Abstraction;


public interface IFileProcessingService<T>
{
    Task<ImportResult<T>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default);
    Task<Result> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default);
}