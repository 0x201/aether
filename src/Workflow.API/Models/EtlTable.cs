namespace Workflow.API.Models;

public class EtlTable
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public int DatabaseId { get; set; }
    
    [ForeignKey(nameof(DatabaseId))]
    public EtlDatabase Database { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<EtlColumn> Columns { get; } = new List<EtlColumn>();
}
