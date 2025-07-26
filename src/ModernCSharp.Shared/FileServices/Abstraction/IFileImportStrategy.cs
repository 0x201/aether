namespace ModernCSharp.Shared.FileServices.Abstraction;

public interface IFileImportStrategy<T>
{
    IReadOnlyCollection<FileType> FileTypes
    {
        get;
    }
    void Initialize(IFileImportContext context);
    Task<ImportResult<T>> ImportAsync(CancellationToken cancellationToken = default);
    bool CanImport(FileType fileType) => FileTypes.Contains(fileType);
}
