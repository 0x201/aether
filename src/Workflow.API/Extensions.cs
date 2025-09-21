using Workflow.API.DataSeed;
using TaskSchedulerService = Workflow.API.Services.TaskScheduler;

public static class Extensions
{
    public static void AddApplicationServices(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;
        builder.Services.AddSignalR();
        AddWorkflowDbContext(builder);
        AddEtlDbContext(builder);

        services.AddScoped<IWorkflowRepository, EfWorkflowRepository>();
        services.AddScoped<IEtlRepository, EtlRepository>();
        services.AddSingleton<INodeExecutor, NodeExecutor>();
        services.AddScoped<IWorkflowScheduler, WorkflowScheduler>();
        services.AddScoped<IEtlService, EtlService>();
        services.AddSingleton<ITaskScheduler, TaskSchedulerService>();
        services.AddHostedService(provider => 
            (TaskSchedulerService)provider.GetRequiredService<ITaskScheduler>());
    }

    private static void AddWorkflowDbContext(IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("workflowdb");
        builder.Services.AddDbContext<WorkflowDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString, sqlOptions => 
            {
                sqlOptions.EnableRetryOnFailure(5);
            });
        }, ServiceLifetime.Singleton, ServiceLifetime.Singleton);
        
        builder.Services.AddDbContextFactory<WorkflowDbContext>();
        builder.EnrichSqlServerDbContext<WorkflowDbContext>();
        builder.Services.AddMigration<WorkflowDbContext, WorkflowDbContextSeed>();
    }

    private static void AddEtlDbContext(IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("etldb");
        builder.Services.AddDbContext<EtlDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString, sqlOptions => 
            {
                sqlOptions.EnableRetryOnFailure(5);
            });
        }, ServiceLifetime.Singleton, ServiceLifetime.Singleton);
        
        builder.Services.AddDbContextFactory<EtlDbContext>();
        builder.EnrichSqlServerDbContext<EtlDbContext>();
        builder.Services.AddMigration<EtlDbContext, EtlDbSeed>();
    }
}