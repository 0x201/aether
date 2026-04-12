namespace Aether.Shared.FileServices.Export;

public abstract class FileExportStrategyBase<T>(params FileType[] fileTypes) : IFileExportStrategy<T>
{
    public IReadOnlyCollection<FileType> FileTypes { get; } = [.. fileTypes];

    public abstract Task<Result> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default);

    public bool CanExport(FileType fileType) => FileTypes.Contains(fileType);
}
