namespace DyDanmaku.API.Application.Services;

public class DanmakuCaptureServiceFactory(IServiceScopeFactory serviceScopeFactory) : IDanmakuCaptureServiceFactory
{
    public IDanmakuCaptureService Create()
    {
        var scope = serviceScopeFactory.CreateScope();
        return scope.ServiceProvider.GetRequiredService<IDanmakuCaptureService>();
    }
}
