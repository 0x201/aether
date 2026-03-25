namespace ModernCSharp.Shared.FileServices.Abstraction;

public interface IFileImportStrategy<T>
{
    IReadOnlyCollection<FileType> FileTypes { get; }
    Task<ImportResult<T>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default);
    bool CanImport(FileType fileType) => FileTypes.Contains(fileType);
}
