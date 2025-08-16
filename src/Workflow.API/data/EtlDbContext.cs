using Microsoft.EntityFrameworkCore;

namespace Workflow.API.Data;

public class EtlDbContext : DbContext
{
    public EtlDbContext(DbContextOptions<EtlDbContext> options) : base(options)
    {
    }
    
    public DbSet<EtlDatabase> Databases => Set<EtlDatabase>();
    public DbSet<EtlTable> Tables => Set<EtlTable>();
    public DbSet<EtlColumn> Columns => Set<EtlColumn>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EtlDatabase>(entity =>
        {
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired();
        });
        
        modelBuilder.Entity<EtlTable>(entity =>
        {
            entity.HasIndex(e => new { e.DatabaseId, e.Name }).IsUnique();
            entity.Property(e => e.Name).IsRequired();
            entity.HasOne(t => t.Database)
                  .WithMany(d => d.Tables)
                  .HasForeignKey(t => t.DatabaseId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<EtlColumn>(entity =>
        {
            entity.HasIndex(e => new { e.TableId, e.Name }).IsUnique();
            entity.Property(e => e.Name).IsRequired();
            entity.Property(e => e.DataType).IsRequired();
            entity.HasOne(c => c.Table)
                  .WithMany(t => t.Columns)
                  .HasForeignKey(c => c.TableId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        base.OnModelCreating(modelBuilder);
    }
}