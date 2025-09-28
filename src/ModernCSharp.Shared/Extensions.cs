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
