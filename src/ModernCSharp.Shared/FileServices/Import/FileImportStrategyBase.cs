namespace ModernCSharp.Shared.FileServices.Import;

public abstract class FileImportStrategyBase<T> : IFileImportStrategy<T>
{
    public IReadOnlyCollection<FileType> FileTypes { get; }

    protected FileImportStrategyBase(params FileType[] fileTypes)
    {
        FileTypes = [.. fileTypes];
    }

    public abstract Task<ImportResult<T>> ImportAsync(CancellationToken cancellationToken = default);

    public void Initialize(IFileImportContext context)
    {
        if (context is not FileImportContext importContext)
        {
            throw new ArgumentException($"Invalid file import context. Expected {typeof(FileImportContext)}, but got {context.GetType()}.");
        }

        OnInitialize(importContext);
    }

    protected virtual void OnInitialize(FileImportContext context) => _context = context;

    protected FileImportContext _context;

    public bool CanImport(FileType fileType) => FileTypes.Contains(fileType);
}
