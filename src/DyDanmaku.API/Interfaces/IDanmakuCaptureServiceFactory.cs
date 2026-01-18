namespace DyDanmaku.API.Interfaces;

internal interface IDanmakuCaptureServiceFactory
{
    IDanmakuCaptureService CreateService();
    void ReleaseService(IDanmakuCaptureService service);
}
