namespace DyDanmaku.API.Apis;

public class DanmakuServices(
    IMediator mediator,
    IDanmakuQueries queries,
    ILogger<DanmakuServices> logger)
{
    public IMediator Mediator { get; set; } = mediator;
    public IDanmakuQueries Queries { get; set; } = queries;
    public ILogger<DanmakuServices> Logger { get; set; } = logger;

}
