using System.Reflection;
using DyDanmaku.API.Infrastructure;
using DyDanmaku.API.Application.EventHandlers;
using DyDanmaku.API.Application.Queries;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Aether.Shared.Interceptors;

namespace DyDanmaku.API;

public static class Extensions
{
    internal static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;

        builder.AddRabbitMqEventBus("eventbus")
            .AddEventBusSubscriptions();
        builder.AddRedisDistributedCache(connectionName: "redis");

        var connectionString = builder.Configuration.GetConnectionString("dydanmakudb");

        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        services.AddDbContext<DyDanmakuDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseNpgsql(connectionString, sqlBuilderOptions => { sqlBuilderOptions.EnableRetryOnFailure(5); });
        });

        builder.EnrichNpgsqlDbContext<DyDanmakuDbContext>();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblyContaining<Program>();
        });

        services.AddMigration<DyDanmakuDbContext, DyDanmakuDbContextSeed>();

        services.AddSingleton<IMemoryTaskScheduler, MemoryTaskScheduler>();
        services.AddSingleton<ICaptureJobManager, CaptureJobManager>();
        services.AddSingleton<IDanmakuPushService, DanmakuPushService>();
        services.AddTransient<IDanmakuCaptureService, DanmakuCaptureService>();
        services.AddScoped<ICaptureJobRepository, CaptureJobRepository>();
        services.AddSingleton<DyDanmakuClientPool>();
        services.AddHostedService(provider => (DanmakuPushService)provider.GetRequiredService<IDanmakuPushService>());
        services.AddHostedService(provider => (CaptureJobManager)provider.GetRequiredService<ICaptureJobManager>());
        services.AddHostedService<CaptureJobMonitoringService>();
        services.AddHostedService<ScheduleTaskService>();

        services.AddScoped<IDanmakuQueries, DanmakuQueries>();
    }

    private static void AddEventBusSubscriptions(this IEventBusBuilder eventBus)
    {
        eventBus.AddSubscription<AnalyticsCompletedIntegrationEvent, AnalyticsCompletedEventHandler>();
    }
}
