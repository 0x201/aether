namespace DyDanmaku.API.Interfaces;

internal interface IDanmakuPushService
{
    Task PushNewDanmakuToRoom(int roomId);
    void StartPushingForRoom(int roomId);
    void StopPushingForRoom(int roomId);
}
