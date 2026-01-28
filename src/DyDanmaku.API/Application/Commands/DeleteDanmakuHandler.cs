namespace DyDanmaku.API.Application.Commands;

public class DeleteDanmakuHandler(DyDanmakuDbContext dbContext) : IRequestHandler<DeleteDanmakuCommand, bool>
{
    public async Task<bool> Handle(DeleteDanmakuCommand request, CancellationToken cancellationToken)
    {
        var entity = await dbContext.Danmakus.FindAsync([request.Id], cancellationToken: cancellationToken);
        if (entity is null)
        {
            return false;
        }
        dbContext.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
