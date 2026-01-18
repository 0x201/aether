namespace DyDanmaku.API.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("dydanmakudb");

        builder.Services.AddDbContextFactory<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString, sqlBuilderOptions => { sqlBuilderOptions.EnableRetryOnFailure(5); });
        });

        builder.Services.AddSingleton<IDanmakuCaptureServiceFactory, DanmakuCaptureServiceFactory>();
        builder.Services.AddSingleton<ICaptureJobManager, CaptureJobManager>();
        builder.Services.AddSingleton<IDanmakuPushService, DanmakuPushService>();
        builder.Services.AddTransient<IDanmakuCaptureService, DanmakuCaptureService>();
        builder.Services.AddTransient<DyDanmakuClient>();
        builder.Services.AddScoped<ICaptureJobRepository, CaptureJobRepository>();
        builder.Services.AddHostedService(provider => (DanmakuPushService)provider.GetRequiredService<IDanmakuPushService>());
        builder.Services.AddHostedService<CaptureJobMonitoringService>();
        builder.Services.AddHostedService<ScheduleTaskService>();
    }


    internal static void AddApiVersioningAndDocumentation(this IServiceCollection services)
    {
        services.AddApiVersioning().AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });

        string[] versions = ["v1", "v2"];
        foreach (var version in versions)
        {
            services.Configure<ScalarOptions>(options => options.AddDocument(version, $"Version {version}", isDefault: version == "v1"));
            services.AddOpenApi(version, options =>
            {
                options.AddDocumentTransformer((document, context, _) =>
                {
                    var descriptionProvider = context.ApplicationServices.GetRequiredService<IApiVersionDescriptionProvider>();
                    var versionDescription = descriptionProvider.ApiVersionDescriptions.FirstOrDefault(x => x.GroupName == version);
                    document.Info.Version = versionDescription?.ApiVersion.ToString();
                    return Task.CompletedTask;
                });
                options.AddDocumentTransformer((document, _, _) =>
                {
                    document.Servers = [];
                    return Task.CompletedTask;
                });
            });
        }
    }
}