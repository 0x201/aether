using System.ComponentModel.DataAnnotations;

namespace Workflow.API.Models;

public class EtlDatabase
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<EtlTable> Tables { get; } = new List<EtlTable>();
}