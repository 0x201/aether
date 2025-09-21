using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace Workflow.API.Data;

public class WorkflowDbContext : DbContext
{
    public WorkflowDbContext(DbContextOptions<WorkflowDbContext> options) : base(options)
    {
    }
    
    public DbSet<WorkflowModel> Workflows => Set<WorkflowModel>();
    public DbSet<ExecutionLog> ExecutionLogs => Set<ExecutionLog>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkflowModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            
            // Configure the Nodes property as JSON
            var nodesConverter = new ValueConverter<List<WorkflowNode>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<List<WorkflowNode>>(v, (JsonSerializerOptions)null!) ?? new List<WorkflowNode>()
            );
            
            entity.Property(e => e.Nodes)
                .HasConversion(nodesConverter)
                .HasColumnType("nvarchar(max)")
                .IsRequired();

            // Configure the Connections property as JSON
            var connectionsConverter = new ValueConverter<List<WorkflowConnection>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<List<WorkflowConnection>>(v, (JsonSerializerOptions)null!) ?? new List<WorkflowConnection>()
            );
            
            entity.Property(e => e.Connections)
                .HasConversion(connectionsConverter)
                .HasColumnType("nvarchar(max)")
                .IsRequired();
        });
        
        modelBuilder.Entity<ExecutionLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.WorkflowId);
            entity.HasIndex(e => e.Timestamp);
            entity.Property(e => e.WorkflowId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.WorkflowName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Message).IsRequired();
            entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
            
            // Configure the Details property as JSON
            var detailsConverter = new ValueConverter<Dictionary<string, object>?, string>(
                v => v == null ? "{}" : JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => string.IsNullOrEmpty(v) ? new Dictionary<string, object>() : JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions)null!) ?? new Dictionary<string, object>()
            );
            
            entity.Property(e => e.Details)
                .HasConversion(detailsConverter)
                .HasColumnType("nvarchar(max)");
        });
        
        base.OnModelCreating(modelBuilder);
    }
}