namespace ModernCSharp.Shared.FileServices.Export;

public class FileExportStrategyFactory<T>(IEnumerable<IFileExportStrategy<T>> strategies)
    : FileStrategyFactoryBase<IFileExportStrategy<T>, IFileExportContext<T>>(strategies),
      IFileExportStrategyFactory<T>
{
    protected override bool CanHandle(IFileExportStrategy<T> strategy, IFileExportContext<T> context) =>
        strategy.CanExport(context.FileType);

    public override IFileExportStrategy<T> GetStrategy(IFileExportContext<T> context)
    {
        var strategy = base.GetStrategy(context);
        strategy.Initialize(context);
        return strategy;
    }
}
