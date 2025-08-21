using System.ComponentModel.DataAnnotations.Schema;

namespace Workflow.API.Models;

public class EtlColumn
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string DataType { get; set; } = string.Empty;
    
    public bool IsPrimaryKey { get; set; }
    
    public bool IsNullable { get; set; } = true;
    
    public string? DefaultValue { get; set; }
    
    public int TableId { get; set; }
    
    [ForeignKey(nameof(TableId))]
    public EtlTable Table { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}