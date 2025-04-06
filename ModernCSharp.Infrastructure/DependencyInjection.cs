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
        services.AddTransient<IFileExportContextStrategy<Order>, OrderCsvExportContextStrategy>();
        services.AddTransient<IFileExportContextStrategy<Order>, OrderJsonExportContextStrategy>();
        services.AddTransient<IFileExportContextStrategy<Order>, OrderExcelExportContextStrategy>();

        services.AddTransient<IFileImportContextStrategy, OrderCsvImportContextStrategy>();
        services.AddTransient<IFileImportContextStrategy, OrderJsonImportContextStrategy>();
        services.AddTransient<IFileImportContextStrategy, OrderExcelImportContextStrategy>();

        services.AddTransient<ImportContextFactory>();
        services.AddTransient<ExportContextFactory<Order>>();

        return services;
    }

    public static IServiceCollection AddFileExporters(this IServiceCollection services)
    {
        services.AddTransient<IFileExportStrategy<Order>, OrderCsvExportStrategy>();
        services.AddTransient<IFileExportStrategy<Order>, OrderJsonExportStrategy>();
        services.AddTransient<IFileExportStrategy<Order>, OrderExcelExportStrategy>();
        services.AddTransient<IFileExportStrategyFactory<Order>, FileExportStrategyFactory<Order>>();
        services.AddTransient<IFileExportService<Order>, FileExportService<Order>>();

        return services;
    }

    public static IServiceCollection AddFileImporters(this IServiceCollection services)
    {
        services.AddTransient<IFileImportStrategy<Order>, OrderCsvImportStrategy>();
        services.AddTransient<IFileImportStrategy<Order>, OrderJsonImportStrategy>();
        services.AddTransient<IFileImportStrategy<Order>, OrderExcelImportStrategy>();

        services.AddTransient<IFileImportStrategyFactory<Order>, FileImportStrategyFactory<Order>>();
        services.AddTransient<IFileImportService<Order>, FileImportService<Order>>();

        return services;
    }
}
