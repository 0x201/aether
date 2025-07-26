namespace ModernCSharp.Shared.FileServices.Export;

public abstract class FileExportStrategyBase<T> : IFileExportStrategy<T>
{
    protected FileExportContext<T> _context;

    public IReadOnlyCollection<FileType> FileTypes { get; }

    protected FileExportStrategyBase(params FileType[] fileTypes)
    {
        FileTypes = [.. fileTypes];
    }

    public abstract Task<Result> ExportAsync(CancellationToken cancellationToken = default);

    public void Initialize(IFileExportContext<T> context)
    {
        if (context is not FileExportContext<T> exportContext)
        {
            throw new ArgumentException($"Invalid file export context. Expected {typeof(FileExportContext<T>)}, but got {context.GetType()}.");
        }

        OnInitialize(exportContext);
    }

    protected virtual void OnInitialize(FileExportContext<T> context) => _context = context;

    public bool CanExport(FileType fileType) => FileTypes.Contains(fileType);
}
