namespace Aether.Shared.FileServices.Export;

public class FileExportStrategyFactory<T>(IEnumerable<IFileExportStrategy<T>> strategies) : IFileExportStrategyFactory<T>
{
    private readonly IEnumerable<IFileExportStrategy<T>> _strategies = strategies ?? throw new ArgumentNullException(nameof(strategies));

    public IFileExportStrategy<T> GetStrategy(FileType fileType)
    {
        var strategy = _strategies.FirstOrDefault(s => s.CanExport(fileType))
            ?? throw new NotSupportedException($"No export strategy found for file type: {fileType}");

        return strategy;
    }
}