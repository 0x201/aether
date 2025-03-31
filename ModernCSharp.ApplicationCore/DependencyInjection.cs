using Microsoft.Extensions.DependencyInjection;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Services.FileExport;
using ModernCSharp.ApplicationCore.Services.FileExport.Handlers;
using ModernCSharp.ApplicationCore.Services.FileExtraction;
using ModernCSharp.ApplicationCore.Services.FileExtraction.Handlers;

namespace ModernCSharp.ApplicationCore;

public static class DependencyInjection
{
    public static IServiceCollection AddFileExporters(this IServiceCollection services)
    {
        services.AddTransient<IFileExportStrategy, OrderJsonExportStrategy>();
        services.AddTransient<IFileExportStrategy, OrderCsvExportStrategy>();
        services.AddTransient<IFileExportStrategy, OrderExcelExportStrategy>();
        services.AddSingleton<IFileExportStrategyFactory, FileExportStrategyFactory>();
        services.AddTransient<IFileExportService, FileExportService>();

        return services;
    }

    public static IServiceCollection AddFileImporters(this IServiceCollection services)
    {
        services.AddTransient<IFileImportStrategy<Order>, OrderJsonImportStrategy>();
        services.AddTransient<IFileImportStrategy<Order>, OrderCsvImportStrategy>();
        services.AddTransient<IFileImportStrategy<Order>, OrderExcelImportStrategy>();
        services.AddSingleton<IFileImportStrategyFactory<Order>, FileImportStrategyFactory<Order>>();
        services.AddTransient<IFileImportService<Order>, FileImportService<Order>>();
        
        return services;
    }
}
