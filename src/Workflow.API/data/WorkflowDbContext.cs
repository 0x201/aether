using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace Workflow.API.Data;

public class WorkflowDbContext : DbContext
{
    public WorkflowDbContext(DbContextOptions<WorkflowDbContext> options) : base(options)
    {
    }
    
    public DbSet<WorkflowModel> Workflows => Set<WorkflowModel>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkflowModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            
            // 为Nodes属性配置JSON转换器
            var nodesConverter = new ValueConverter<List<WorkflowNode>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<List<WorkflowNode>>(v, (JsonSerializerOptions)null!) ?? new List<WorkflowNode>()
            );
            
            entity.Property(e => e.Nodes)
                .HasConversion(nodesConverter)
                .HasColumnType("nvarchar(max)");

            // 为Connections属性配置JSON转换器
            var connectionsConverter = new ValueConverter<List<WorkflowConnection>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<List<WorkflowConnection>>(v, (JsonSerializerOptions)null!) ?? new List<WorkflowConnection>()
            );
            
            entity.Property(e => e.Connections)
                .HasConversion(connectionsConverter)
                .HasColumnType("nvarchar(max)");
        });
        
        base.OnModelCreating(modelBuilder);
    }
}