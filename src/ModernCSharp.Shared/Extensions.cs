using System.Linq.Expressions;

namespace ModernCSharp.Shared;

public static class FileStrategyServiceCollectionExtensions
{
    public static IServiceCollection AddFileImportStrategy<TStrategy, T>(this IServiceCollection services)
        where TStrategy : class, IFileImportStrategy<T>
    {
        services.AddSingleton<IFileImportStrategy<T>, TStrategy>();
        return services;
    }

    public static IServiceCollection AddFileExportStrategy<TStrategy, T>(this IServiceCollection services)
        where TStrategy : class, IFileExportStrategy<T>
    {
        services.AddSingleton<IFileExportStrategy<T>, TStrategy>();
        return services;
    }

    public static IServiceCollection AddFileProcessor<T>(this IServiceCollection services)
    {
        services.AddSingleton<IFileExportStrategyFactory<T>, FileExportStrategyFactory<T>>();
        services.AddSingleton<IFileImportStrategyFactory<T>, FileImportStrategyFactory<T>>();
        services.AddScoped<IFileProcessingService<T>, FileProcessingService<T>>();
        return services;
    }
}


public static class CollectionExtensions
{
    public static IQueryable<T> WhereIf<T>(this IQueryable<T> query, bool condition, Expression<Func<T, bool>> predicate)
    => condition ? query.Where(predicate) : query;

    public static IQueryable<T> PagedBy<T>(this IQueryable<T> query, int page, int pageSize)
    {
        if (page < 1)
            page = 1;
        if (pageSize < 1)
            pageSize = 10;

        page -= 1;

        return query.Skip(page * pageSize).Take(pageSize);
    }
}
