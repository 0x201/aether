using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Workflow.API.Data;

public class EtlDbContextFactory : IDesignTimeDbContextFactory<EtlDbContext>
{
    public EtlDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<EtlDbContext>();
        optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=WorkflowEtlDb;Trusted_Connection=true;MultipleActiveResultSets=true");

        return new EtlDbContext(optionsBuilder.Options);
    }
}