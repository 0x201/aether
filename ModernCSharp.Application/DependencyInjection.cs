using Microsoft.Extensions.DependencyInjection;

using ModernCSharp.Application.Abstractions;
using ModernCSharp.Application.Models;
using ModernCSharp.Application.Services.FileExport;
using ModernCSharp.Application.Services.FileExport.Handlers;
using ModernCSharp.Application.Services.FileExtraction;
using ModernCSharp.Application.Services.FileExtraction.Handlers;

namespace ModernCSharp.Application;

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
