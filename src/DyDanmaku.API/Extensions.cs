using DyDanmaku.API.Infrastructure;

namespace DyDanmaku.API;

public static class Extensions
{
    internal static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;
        var connectionString = builder.Configuration.GetConnectionString("dydanmakudb");

        services.AddDbContextFactory<DyDanmakuDbContext>(options =>
        {
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
}
