namespace Workflow.API;

internal static class Extensions
{
    public static void AddApplicationServices(this IHostApplicationBuilder builder)
    {
        // 添加 CORS 支持
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        builder.Services.AddSignalR();

        AddWorkflowDbContext(builder);
        AddEtlDbContext(builder);

        builder.Services.AddScoped<IWorkflowRepository, EfWorkflowRepository>();
        builder.Services.AddSingleton<INodeExecutor, NodeExecutor>();
        builder.Services.AddSingleton<IWorkflowScheduler, WorkflowScheduler>();
        builder.Services.AddSingleton<IEtlService, EtlService>();
    }

    private static void AddWorkflowDbContext(IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("WorkflowDb") 
            ?? "Server=(localdb)\\mssqllocaldb;Database=WorkflowDb;Trusted_Connection=true;MultipleActiveResultSets=true";

        builder.Services.AddDbContext<WorkflowDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString, sqlOptions => 
            {
                sqlOptions.EnableRetryOnFailure(5);
            });
        });

        builder.Services.AddMigration<WorkflowDbContext, WorkflowDbContextSeed>();
    }

    private static void AddEtlDbContext(IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("EtlDb") 
            ?? "Server=(localdb)\\mssqllocaldb;Database=WorkflowEtlDb;Trusted_Connection=true;MultipleActiveResultSets=true";

        builder.Services.AddDbContext<EtlDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString, sqlOptions => 
            {
                sqlOptions.EnableRetryOnFailure(5);
            });
        });

        builder.Services.AddMigration<EtlDbContext, EtlDbContextSeed>();
    }
}