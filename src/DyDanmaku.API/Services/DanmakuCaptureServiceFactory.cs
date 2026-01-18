namespace DyDanmaku.API.Services;

internal class DanmakuCaptureServiceFactory(IServiceProvider serviceProvider) : IDanmakuCaptureServiceFactory
{
    public IDanmakuCaptureService CreateService()
    {
        // Create a new scope for each service instance
        using var scope = serviceProvider.CreateScope();
        
        return new DanmakuCaptureService(
            scope.ServiceProvider.GetRequiredService<IDbContextFactory<ApplicationDbContext>>(),
            scope.ServiceProvider.GetRequiredService<DyDanmakuClient>(),
            scope.ServiceProvider.GetRequiredService<IHttpClientFactory>(),
            scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>(),
            scope.ServiceProvider.GetRequiredService<IConfiguration>(),
            scope.ServiceProvider.GetRequiredService<ILogger<DanmakuCaptureService>>()
        );
    }

    public void ReleaseService(IDanmakuCaptureService service)
    {
        if (service is IAsyncDisposable asyncDisposable)
        {
            asyncDisposable.DisposeAsync();
        }
        else if (service is IDisposable disposable)
        {
            disposable.Dispose();
        }
    }
}