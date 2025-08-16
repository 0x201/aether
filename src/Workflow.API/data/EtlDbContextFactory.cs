using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Workflow.API.Data;

public class EtlDbContextFactory : IDesignTimeDbContextFactory<EtlDbContext>
{
    public EtlDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<EtlDbContext>();
        var dbPath = Path.Combine(AppContext.BaseDirectory, "data", "etl_metadata.db");
        optionsBuilder.UseSqlite($"Data Source={dbPath}");

        return new EtlDbContext(optionsBuilder.Options);
    }
}