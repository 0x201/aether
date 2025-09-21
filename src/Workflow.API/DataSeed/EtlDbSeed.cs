namespace Workflow.API.DataSeed;

public class EtlDbSeed(ILogger<EtlDbSeed> logger) : IDbSeeder<EtlDbContext>
{
    private readonly ILogger<EtlDbSeed> _logger = logger;

    public async Task SeedAsync(EtlDbContext context)
    {
        _logger.LogInformation("Starting EtlDbContext seed");

        if (!context.Databases.Any())
        {
            _logger.LogInformation("Seeding initial ETL data");

            var sampleDatabase = new EtlDatabase
            {
                Name = "SampleDB",
                CreatedAt = DateTime.UtcNow
            };

            context.Databases.Add(sampleDatabase);
            await context.SaveChangesAsync();

            var sampleTable = new EtlTable
            {
                Name = "SampleTable",
                DatabaseId = sampleDatabase.Id,
                CreatedAt = DateTime.UtcNow
            };

            context.Tables.Add(sampleTable);
            await context.SaveChangesAsync();

            var columns = new List<EtlColumn>
            {
                new EtlColumn
                {
                    Name = "Id",
                    TableId = sampleTable.Id,
                    DataType = "INTEGER",
                    IsPrimaryKey = true,
                    CreatedAt = DateTime.UtcNow
                },
                new EtlColumn
                {
                    Name = "Name",
                    TableId = sampleTable.Id,
                    DataType = "TEXT",
                    IsNullable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new EtlColumn
                {
                    Name = "Value",
                    TableId = sampleTable.Id,
                    DataType = "REAL",
                    IsNullable = true,
                    CreatedAt = DateTime.UtcNow
                },
                new EtlColumn
                {
                    Name = "CreatedAt",
                    TableId = sampleTable.Id,
                    DataType = "DATETIME",
                    IsNullable = false,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Columns.AddRange(columns);
            await context.SaveChangesAsync();

            _logger.LogInformation("Seeded sample ETL database structure");
        }
        else
        {
            _logger.LogInformation("ETL data already exists, skipping seed");
        }
    }
}