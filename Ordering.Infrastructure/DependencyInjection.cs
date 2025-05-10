using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Common.Interfaces;
using ModernCSharp.Domain.Constants;
using ModernCSharp.Ordering.Infrastructure.Data;
using ModernCSharp.Ordering.Infrastructure.Data.Interceptors;
using ModernCSharp.Infrastructure.Identity;
using ModernCSharp.Infrastructure.Services.FileContext;
using ModernCSharp.Infrastructure.Services.FileContext.Strategy;
using ModernCSharp.Infrastructure.Services.FileExport;
using ModernCSharp.Infrastructure.Services.FileExport.Handlers;
using ModernCSharp.Infrastructure.Services.FileExtraction;
using ModernCSharp.Infrastructure.Services.FileExtraction.Handlers;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.Ordering.Domain.Constants;

namespace ModernCSharp.Ordering.Infrastructure;

public static class DependencyInjection
{
    public static void AddInfrastructureServices(this IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("OrderingDb");

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        builder.Services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();

        builder.Services.AddDbContext<OrderingDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseSqlServer(connectionString).AddAsyncSeeding(sp);
        });

        builder.EnrichSqlServerDbContext<OrderingDbContext>();

        builder.Services.AddScoped<OrderingDbContextInitializer>();

        builder.Services
            .AddDefaultIdentity<ApplicationUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<OrderingDbContext>();

        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddTransient<IIdentityService, IdentityService>();

        builder.Services.AddAuthorizationBuilder()
            .AddPolicy(Policies.CanPurge, policy => policy.RequireRole(Roles.Administrator));
    }
    
    public static void AddFileProcessServices(this IHostApplicationBuilder builder)
    {
        builder.Services.AddFileContexts();
        builder.Services.AddFileExporters();
        builder.Services.AddFileImporters();
    }

    public static IServiceCollection AddFileContexts(this IServiceCollection services)
    {
        services.AddSingleton<IFileExportContextStrategy<Order>, OrderCsvExportContextStrategy>();
        services.AddSingleton<IFileExportContextStrategy<Order>, OrderJsonExportContextStrategy>();
        services.AddSingleton<IFileExportContextStrategy<Order>, OrderExcelExportContextStrategy>();

        services.AddSingleton<IFileImportContextStrategy, OrderCsvImportContextStrategy>();
        services.AddSingleton<IFileImportContextStrategy, OrderJsonImportContextStrategy>();
        services.AddSingleton<IFileImportContextStrategy, OrderExcelImportContextStrategy>();

        services.AddSingleton<ImportContextFactory>();
        services.AddSingleton(typeof(ExportContextFactory<>));

        return services;
    }

    public static IServiceCollection AddFileExporters(this IServiceCollection services)
    {
        services.AddSingleton<IFileExportStrategy<Order>, OrderCsvExportStrategy>();
        services.AddSingleton<IFileExportStrategy<Order>, OrderJsonExportStrategy>();
        services.AddSingleton<IFileExportStrategy<Order>, OrderExcelExportStrategy>();


        services.AddSingleton(typeof(IFileExportStrategyFactory<>), typeof(FileExportStrategyFactory<>));
        services.AddSingleton(typeof(IFileExportService<>), typeof(FileExportService<>));

        return services;
    }

    public static IServiceCollection AddFileImporters(this IServiceCollection services)
    {
        services.AddSingleton<IFileImportStrategy<Order>, OrderCsvImportStrategy>();
        services.AddSingleton<IFileImportStrategy<Order>, OrderJsonImportStrategy>();
        services.AddSingleton<IFileImportStrategy<Order>, OrderExcelImportStrategy>();

        services.AddSingleton(typeof(IFileImportStrategyFactory<>), typeof(FileImportStrategyFactory<>));
        services.AddSingleton(typeof(IFileImportService<>), typeof(FileImportService<>));

        return services;
    }
}
