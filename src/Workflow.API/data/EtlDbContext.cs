using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Workflow.API.Data;

public class EtlDbContext : DbContext
{
    public EtlDbContext(DbContextOptions<EtlDbContext> options) : base(options)
    {
    }
    
    public DbSet<EtlDatabase> Databases => Set<EtlDatabase>();
    public DbSet<EtlTable> Tables => Set<EtlTable>();
    public DbSet<EtlColumn> Columns => Set<EtlColumn>();
    public DbSet<TaskInstance> TaskInstances => Set<TaskInstance>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EtlDatabase>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });
        
        modelBuilder.Entity<EtlTable>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.DatabaseId, e.Name }).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            
            entity.HasOne(t => t.Database)
                  .WithMany(d => d.Tables)
                  .HasForeignKey(t => t.DatabaseId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<EtlColumn>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TableId, e.Name }).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.DataType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            
            entity.HasOne(c => c.Table)
                  .WithMany(t => t.Columns)
                  .HasForeignKey(c => c.TableId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<TaskInstance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaskId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.WorkflowId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.State).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });
        
        base.OnModelCreating(modelBuilder);
    }
}