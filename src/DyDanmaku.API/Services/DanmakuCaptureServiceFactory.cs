namespace DyDanmaku.API.Services;

internal class DanmakuCaptureServiceFactory(IServiceProvider serviceProvider) : IDanmakuCaptureServiceFactory
{
    public IDanmakuCaptureService CreateService()
    {
        var serviceScopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
        
        return new DanmakuCaptureService(
            serviceScopeFactory,
            serviceProvider.GetRequiredService<IMemoryTaskScheduler>(),
            serviceProvider.GetRequiredService<IHttpClientFactory>(),
            serviceProvider.GetRequiredService<IConfiguration>(),
            serviceProvider.GetRequiredService<ILogger<DanmakuCaptureService>>()
        );
    }

    public void ReleaseService(IDanmakuCaptureService service)
    {
    }
}