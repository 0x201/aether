namespace DyDanmaku.Infrastructure;

public class DyDanmakuDbContextSeed : IDbSeeder<DyDanmakuDbContext>
{
    public async Task SeedAsync(DyDanmakuDbContext context)
    {
        await context.Database.MigrateAsync();
    }
}
