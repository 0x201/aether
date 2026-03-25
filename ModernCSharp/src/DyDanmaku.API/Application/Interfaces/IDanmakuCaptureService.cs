namespace DyDanmaku.API.Application.Interfaces;

public interface IDanmakuCaptureService
{
    Task StartAsync(int roomId, int duration = 3600);
    Task StopAsync();
    void SetCleanupCallback(Action<int> onCaptureCompleted);
}