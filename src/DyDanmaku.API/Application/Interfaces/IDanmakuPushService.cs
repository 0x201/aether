namespace DyDanmaku.API.Application.Interfaces;

public interface IDanmakuPushService
{
    Task PushNewDanmakuToRoom(int roomId);
    void StartPushingForRoom(int roomId);
    void StopPushingForRoom(int roomId);
}
