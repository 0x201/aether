namespace DyDanmaku.API.Interfaces;

internal interface IDanmakuService
{
    Task<Result> GetPagedList(string roomId, string roomUrl, int duration);
}
