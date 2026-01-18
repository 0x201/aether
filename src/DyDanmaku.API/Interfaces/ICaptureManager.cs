namespace DyDanmaku.API.Interfaces;

internal interface ICaptureJobManager
{
    Task<bool> StartAsync(int roomId, int? duration, CancellationToken cancellationToken = default);
    Task<bool> StopAsync(int roomId, CancellationToken cancellationToken = default);
}