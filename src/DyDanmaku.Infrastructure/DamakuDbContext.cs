namespace DyDanmaku.Infrastructure;

public class DyDanmakuDbContext : DbContext, IUnitOfWork
{
    public DbSet<Danmaku> Danmakus { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<CaptureJob> CaptureJobs { get; set; }

    public DbSet<DanmakuAnalysis> DanmakuAnalyses { get; set; }

    public DyDanmakuDbContext(DbContextOptions<DyDanmakuDbContext> options) : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        modelBuilder.HasDefaultSchema("dydanmaku");

        base.OnModelCreating(modelBuilder);
    }

    public async Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default)
    {

        _ = await base.SaveChangesAsync(cancellationToken);
        return true;
    }
}