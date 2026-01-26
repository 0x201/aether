namespace DyDanmaku.API.Interfaces;

internal interface IDanmakuCaptureService
{
    Task Start(int roomId, int duration = 3600);
    Task Stop(int roomId);
    Task Stop();
    void SetCleanupCallback(Action<int> onCaptureCompleted);
}