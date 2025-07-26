namespace ModernCSharp.Shared.FileServices.Abstraction;

public interface IFileExportStrategy<T>
{
    IReadOnlyCollection<FileType> FileTypes
    {
        get;
    }
    void Initialize(IFileExportContext<T> context);
    Task<Result> ExportAsync(CancellationToken cancellationToken = default);
    bool CanExport(FileType fileType) => FileTypes.Contains(fileType);
}
