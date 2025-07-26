namespace ModernCSharp.Shared.FileServices;

public abstract class FileStrategyFactoryBase<TStrategy, TContext>(IEnumerable<TStrategy> strategies)
    where TStrategy : class
{
    private readonly IReadOnlyCollection<TStrategy> _strategies = strategies?.ToArray() ?? throw new ArgumentNullException(nameof(strategies));

    protected abstract bool CanHandle(TStrategy strategy, TContext context);

    public virtual TStrategy GetStrategy(TContext context)
    {
        if (context is null)
        {
            throw new ArgumentNullException(nameof(context));
        }

        var strategy = _strategies.FirstOrDefault(s => CanHandle(s, context))
            ?? throw new NotSupportedException($"Cannot find the implementation of {nameof(TStrategy)} for {context.GetType().Name}");

        return strategy;
    }
}
