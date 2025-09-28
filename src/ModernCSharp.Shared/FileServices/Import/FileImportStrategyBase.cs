namespace ModernCSharp.Shared.FileServices.Import;

public abstract class FileImportStrategyBase<T>(params FileType[] fileTypes) : IFileImportStrategy<T>
{
    public IReadOnlyCollection<FileType> FileTypes { get; } = [.. fileTypes];

    public abstract Task<ImportResult<T>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default);

    public bool CanImport(FileType fileType) => FileTypes.Contains(fileType);
}
