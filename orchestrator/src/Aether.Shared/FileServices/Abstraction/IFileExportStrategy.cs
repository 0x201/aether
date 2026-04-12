namespace Aether.Shared.FileServices.Abstraction;

public interface IFileExportStrategy<T>
{
    IReadOnlyCollection<FileType> FileTypes { get; }
    Task<Result> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default);
    bool CanExport(FileType fileType) => FileTypes.Contains(fileType);
}
