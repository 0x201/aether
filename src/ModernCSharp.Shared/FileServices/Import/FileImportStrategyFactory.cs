namespace ModernCSharp.Shared.FileServices.Import;

public class FileImportStrategyFactory<T>(IEnumerable<IFileImportStrategy<T>> strategies)
    : FileStrategyFactoryBase<IFileImportStrategy<T>, IFileImportContext>(strategies),
      IFileImportStrategyFactory<T>
{
    protected override bool CanHandle(IFileImportStrategy<T> strategy, IFileImportContext context) =>
        strategy.CanImport(context.FileType);

    public override IFileImportStrategy<T> GetStrategy(IFileImportContext context)
    {
        var strategy = base.GetStrategy(context);
        strategy.Initialize(context);
        return strategy;
    }
}
