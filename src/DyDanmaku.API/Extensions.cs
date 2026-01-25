using DyDanmaku.API.Infrastructure;
using DyDanmaku.Application.EventHandlers;
using Microsoft.EntityFrameworkCore.Diagnostics;
using ModernCSharp.Shared.Interceptors;

namespace DyDanmaku.API;

public static class Extensions
{
    internal static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;

        builder.AddRabbitMqEventBus("eventbus")
            .AddEventBusSubscriptions();

        var connectionString = builder.Configuration.GetConnectionString("dydanmakudb");

        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        services.AddDbContext<DyDanmakuDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseNpgsql(connectionString, sqlBuilderOptions => { sqlBuilderOptions.EnableRetryOnFailure(5); });
        });

        builder.EnrichNpgsqlDbContext<DyDanmakuDbContext>();

        services.AddMigration<DyDanmakuDbContext, DyDanmakuDbContextSeed>();

        services.AddSingleton<IDanmakuCaptureServiceFactory, DanmakuCaptureServiceFactory>();
        services.AddSingleton<ICaptureJobManager, CaptureJobManager>();
        services.AddSingleton<IDanmakuPushService, DanmakuPushService>();
        services.AddTransient<IDanmakuCaptureService, DanmakuCaptureService>();
        services.AddTransient<DyDanmakuClient>();
        services.AddScoped<ICaptureJobRepository, CaptureJobRepository>();
        services.AddHostedService(provider => (DanmakuPushService)provider.GetRequiredService<IDanmakuPushService>());
        services.AddHostedService<CaptureJobMonitoringService>();
        services.AddHostedService<ScheduleTaskService>();
    }

    private static void AddEventBusSubscriptions(this IEventBusBuilder eventBus)
    {
        eventBus.AddSubscription<AnalyticsCompletedIntegrationEvent, AnalyticsCompletedEventHandler>();
    }
}
