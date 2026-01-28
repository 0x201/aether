namespace DyDanmaku.API.Application.Interfaces;

public interface ICaptureJobManager
{
    Task<bool> StartAsync(int roomId, int? duration, CancellationToken cancellationToken = default);
    Task<bool> StopAsync(int roomId, CancellationToken cancellationToken = default);
}