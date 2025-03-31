using Microsoft.Extensions.DependencyInjection;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.Infrastructure.Services;
using ModernCSharp.Infrastructure.Services.FileExport;
using ModernCSharp.Infrastructure.Services.FileExport.Handlers;
using ModernCSharp.Infrastructure.Services.FileExtraction;
using ModernCSharp.Infrastructure.Services.FileExtraction.Handlers;

namespace ModernCSharp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddFileContexts(this IServiceCollection services)
    {

        services.Scan(scan => scan
            .FromAssemblyOf<OrderCsvExportContextStrategy>()
            .AddClasses(c => c.AssignableTo(typeof(IFileExportContextStrategy<>)))
            .AsImplementedInterfaces()
            .WithTransientLifetime());

        services.Scan(scan => scan
            .FromAssemblyOf<OrderCsvImportContextStrategy>()
            .AddClasses(c => c.AssignableTo<IFileImportContextStrategy>())
            .AsImplementedInterfaces()
            .WithTransientLifetime());

        services.AddTransient<ImportContextFactory>();
        services.AddTransient<ExportContextFactory<Order>>();

        return services;
    }

    public static IServiceCollection AddFileExporters(this IServiceCollection services)
    {
        services.Scan(scan => scan
            .FromAssemblyOf<OrderJsonExportStrategy>()
            .AddClasses(c => c.AssignableTo(typeof(IFileExportStrategy<>)))
            .AsImplementedInterfaces()
            .WithTransientLifetime());


        services.Scan(scan => scan
            .FromAssemblyOf<FileExportStrategyFactory<Order>>()
            .AddClasses(c => c.AssignableTo(typeof(IFileExportStrategyFactory<>)))
            .AsImplementedInterfaces()
            .WithTransientLifetime());

        services.AddTransient<IFileExportService<Order>, FileExportService<Order>>();

        return services;
    }

    public static IServiceCollection AddFileImporters(this IServiceCollection services)
    {
        services.Scan(scan => scan
            .FromAssemblyOf<OrderJsonImportStrategy>()
            .AddClasses(c => c.AssignableTo(typeof(IFileImportStrategy<>)))
            .AsImplementedInterfaces()
            .WithTransientLifetime());

        services.Scan(scan => scan
            .FromAssemblyOf<FileImportStrategyFactory<Order>>()
            .AddClasses(c => c.AssignableTo(typeof(IFileImportStrategyFactory<>)))
            .AsImplementedInterfaces()
            .WithTransientLifetime());


        services.AddTransient<IFileImportService<Order>, FileImportService<Order>>();

        return services;
    }
}
