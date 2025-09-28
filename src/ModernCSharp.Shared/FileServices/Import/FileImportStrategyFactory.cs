namespace ModernCSharp.Shared.FileServices.Import;


public class FileImportStrategyFactory<T>(IEnumerable<IFileImportStrategy<T>> strategies) : IFileImportStrategyFactory<T>
{
    private readonly IEnumerable<IFileImportStrategy<T>> _strategies = strategies ?? throw new ArgumentNullException(nameof(strategies));

    public IFileImportStrategy<T> GetStrategy(FileType fileType)
    {
        var strategy = _strategies.FirstOrDefault(s => s.CanImport(fileType))
            ?? throw new NotSupportedException($"No import strategy found for file type: {fileType}");

        return strategy;
    }
}