var builder = DistributedApplication.CreateBuilder(args);

var redis = builder.AddRedis("redis", port: 6379)
                   .WithLifetime(ContainerLifetime.Persistent)
                   .WithRedisInsight(config =>
                   {
                       config.WithHostPort(6378);
                       config.WithContainerName("redis-insight");
                       config.WithLifetime(ContainerLifetime.Persistent);
                   })
                   .WithDataVolume()
                   .WithContainerName("redis");

var rabbitmq = builder.AddRabbitMQ("eventbus", port: 5672)
                      .WithLifetime(ContainerLifetime.Persistent)
                      .WithManagementPlugin(port: 15672)
                      .WithDataVolume()
                      .WithContainerName("eventbus");

var sqlServer = builder.AddSqlServer("sqlserver", port: 14330)
                       .WithLifetime(ContainerLifetime.Persistent)
                       .WithDataVolume()
                       .WithContainerName("sql-server");

var bookstoreDb = sqlServer.AddDatabase("bookstoredb");
var identityDb = sqlServer.AddDatabase("identitydb");
var orderDb = sqlServer.AddDatabase("orderingdb");
var catalogDb = sqlServer.AddDatabase("catalogdb");
var workflowDb = sqlServer.AddDatabase("workflowdb");
var etlDb = sqlServer.AddDatabase("etldb");

var launchProfileName = ShouldUseHttpForEndpoints() ? "http" : "https";

var identityApi = builder.AddProject<Projects.Identity_API>("identity-api", launchProfileName)
    .WithExternalHttpEndpoints()
    .WithReference(identityDb).WaitFor(identityDb);

var identityEndpoint = identityApi.GetEndpoint("https");

var catalogApi = builder.AddProject<Projects.Catalog_API>("catalog-api")
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(catalogDb);

var orderingApi = builder.AddProject<Projects.Ordering_API>("ordering-api")
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderDb).WaitFor(orderDb)
    .WithHttpHealthCheck("/health")
    .WithEnvironment("Identity__Url", identityEndpoint);

var workflowApi = builder.AddProject<Projects.Workflow_API>("workflow-api")
    .WithReference(workflowDb).WaitFor(workflowDb)
    .WithReference(etlDb).WaitFor(etlDb)
    .WithHttpHealthCheck("/health");

var workflowApp = builder.AddViteApp("workflow-app", @"../workflow-app", "pnpm")
    .WithPnpmPackageInstallation()
    .WithExternalHttpEndpoints()
    .WithReference(workflowApi);

builder.AddProject<Projects.OrderProcessor>("order-processor")
    .WithReference(redis)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderDb)
    .WaitFor(orderingApi);

var webApp = builder.AddProject<Projects.ModernCSharp_Web>("webapp")
    .WithExternalHttpEndpoints()
    .WithReference(orderingApi)
    .WithReference(catalogApi)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithEnvironment("IdentityUrl", identityEndpoint);

var bookStoreApi = builder.AddPnpmApp("bookstore-api", @"../bookstore-api", "start:dev")
    .WithHttpEndpoint(targetPort: 3000, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(bookstoreDb).WaitFor(bookstoreDb);
bookStoreApi.WithUrl($"{bookStoreApi.GetEndpoint("http")}/scalar", "Book Store API Scalar Reference");

var bookstoreApp = builder.AddPnpmApp("bookstore-app", @"../bookstore-app", "start")
    .WithHttpEndpoint(targetPort: 4200, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(bookStoreApi);

#pragma warning disable ASPIREHOSTINGPYTHON001 
var crawlerApi = builder.AddPythonApp("crawler-api", @"../crawler-api", "./.venv/Scripts/uvicorn.exe", ["main:app"])
    .WithHttpEndpoint(targetPort: 8000, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithOtlpExporter()
    .WithReference(bookstoreDb).WaitFor(bookstoreDb);
#pragma warning restore ASPIREHOSTINGPYTHON001

crawlerApi.WithUrl($"{crawlerApi.GetEndpoint("http")}/scalar", "Crawler API Scalar Reference");

var crawlerApp = builder.AddViteApp("crawler-app", @"../crawler-app", "pnpm")
    .WithPnpmPackageInstallation()
    .WithReference(crawlerApi)
    .WithExternalHttpEndpoints();


webApp.WithEnvironment("CallBackUrl", webApp.GetEndpoint("https"));
identityApi.WithEnvironment("OrderingApiClient", orderingApi.GetEndpoint("https"))
           .WithEnvironment("WebAppClient", webApp.GetEndpoint("https"));


builder.Build().Run();


static bool ShouldUseHttpForEndpoints()
{
    const string EnvVarName = "MODERNCSHARP_USE_HTTP_ENDPOINTS";
    var envValue = Environment.GetEnvironmentVariable(EnvVarName);

    // Attempt to parse the environment variable value; return true if it's exactly "1".
    return int.TryParse(envValue, out var result) && result == 1;
}
