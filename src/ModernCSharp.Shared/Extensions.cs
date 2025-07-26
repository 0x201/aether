namespace ModernCSharp.Shared;

public static class FileStrategyServiceCollectionExtensions
{
    public static IServiceCollection AddFileImporter<T>(this IServiceCollection services)
    {
        services.AddSingleton<FileStrategyFactoryBase<IFileImportStrategy<T>, IFileImportContext>,
            FileImportStrategyFactory<T>>();

        services.AddSingleton<IFileImportStrategyFactory<T>, FileImportStrategyFactory<T>>();

        return services;
    }

    public static IServiceCollection AddFileExporter<T>(this IServiceCollection services)
    {
        services.AddSingleton<FileStrategyFactoryBase<IFileExportStrategy<T>, IFileExportContext<T>>,
            FileExportStrategyFactory<T>>();

        services.AddSingleton<IFileExportStrategyFactory<T>, FileExportStrategyFactory<T>>();

        return services;
    }

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
        return services
            .AddFileImporter<T>()
            .AddFileExporter<T>();
    }
}
