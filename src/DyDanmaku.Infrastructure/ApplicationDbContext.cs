using System.Reflection;
using DyDanmaku.Domain.Entity;
using Microsoft.EntityFrameworkCore;

namespace DyDanmaku.Infrastructure;

public class ApplicationDbContext : DbContext
{

    public DbSet<Danmaku> Danmakus { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<CaptureJob> CaptureJobs { get; set; }

    public DbSet<DanmakuAnalysis> DanmakuAnalyses { get; set; }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        modelBuilder.HasDefaultSchema("dydanmaku");

        base.OnModelCreating(modelBuilder);
    }
}