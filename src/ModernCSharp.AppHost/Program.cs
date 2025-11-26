var builder = DistributedApplication.CreateBuilder(args);

var redis = builder.AddRedis("redis", port: 6379)
                   .WithLifetime(ContainerLifetime.Persistent)
                                      .WithDataVolume()
                   .WithContainerName("redis");

var rabbitmq = builder.AddRabbitMQ("eventbus", port: 5672)
                      .WithLifetime(ContainerLifetime.Persistent)
                      .WithManagementPlugin(port: 15672)
                      .WithDataVolume()
                      .WithContainerName("eventbus");

var sqlServer = builder.AddSqlServer("sqlserver", port: 14330)
                       .WithImage("mssql/server", "2025-latest")
                       .WithLifetime(ContainerLifetime.Persistent)
                       .WithDataVolume()
                       .WithContainerName("sql-server");

var keycloak = builder.AddKeycloak("keycloak", port: 8080)
                      .WithLifetime(ContainerLifetime.Persistent)
                      .WithDataVolume()
                      .WithRealmImport("./realm.json")
                      .WithContainerName("keycloak");

var bookstoredb = sqlServer.AddDatabase("bookstoredb");
var orderingdb = sqlServer.AddDatabase("orderingdb");
var catalogdb = sqlServer.AddDatabase("catalogdb");
var workflowdb = sqlServer.AddDatabase("workflowdb");
var etldb = sqlServer.AddDatabase("etldb");


var launchProfileName = ShouldUseHttpForEndpoints() ? "http" : "https";

var catalogApi = builder.AddProject<Projects.Catalog_API>("catalogapi")
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(catalogdb)
    .WithReference(keycloak).WaitFor(keycloak);

var orderingApi = builder.AddProject<Projects.Ordering_API>("orderingapi")
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderingdb).WaitFor(orderingdb)
    .WithHttpHealthCheck("/health")
    .WithReference(keycloak).WaitFor(keycloak);

var workflowApi = builder.AddProject<Projects.Workflow_API>("workflowapi")
    .WithReference(workflowdb).WaitFor(workflowdb)
    .WithReference(etldb).WaitFor(etldb)
    .WithHttpHealthCheck("/health")
    .WithReference(keycloak).WaitFor(keycloak);

var workflowApp = builder.AddPnpmApp("workflowapp", @"../workflow-app", "dev")
    .WithReference(workflowApi)
    .WithHttpEndpoint(port: 3010, env: "VITE_PORT")
    .WithPnpmPackageInstallation()
    .WithExternalHttpEndpoints()
    .WithReference(keycloak).WaitFor(keycloak);

builder.AddProject<Projects.OrderProcessor>("orderprocessor")
    .WithReference(redis)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderingdb)
    .WaitFor(orderingApi);

var webApp = builder.AddProject<Projects.ModernCSharp_WebApp>("webapp")
    .WithExternalHttpEndpoints()
    .WithReference(orderingApi)
    .WithReference(catalogApi)
    .WithReference(rabbitmq).WaitFor(rabbitmq);

var bookStoreApi = builder.AddPnpmApp("bookstoreapi", @"../bookstore-api", "start:dev")
    .WithHttpEndpoint(port: 3011, env: "PORT")
    .WithPnpmPackageInstallation()
    .WithExternalHttpEndpoints()
    .WithReference(keycloak).WaitFor(keycloak)
    .WithReference(bookstoredb).WaitFor(bookstoredb);
var bookstoreApiHttpEndpoint = bookStoreApi.GetEndpoint("http");
bookStoreApi.WithUrl($"{bookstoreApiHttpEndpoint}/scalar", "Book Store API Scalar Reference");

var bookstoreApp = builder.AddPnpmApp("bookstoreapp", @"../bookstore-app", "start")
    .WithHttpEndpoint(port: 3012, env: "PORT")
    .WithPnpmPackageInstallation()
    .WithExternalHttpEndpoints()
    .WithReference(bookStoreApi)
    .WithReference(keycloak).WaitFor(keycloak);

#pragma warning disable ASPIREHOSTINGPYTHON001
var crawlerApi = builder.AddPythonApp("crawlerapi", @"../crawler-api", "main.py")
    .WithHttpEndpoint(port: 3013, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithOtlpExporter()
    .WithReference(bookstoredb).WaitFor(bookstoredb)
    .WithReference(keycloak).WaitFor(keycloak);
#pragma warning restore ASPIREHOSTINGPYTHON001
crawlerApi.WithUrl($"{crawlerApi.GetEndpoint("http")}/scalar", "Crawler API Scalar Reference");

var crawlerApp = builder.AddPnpmApp("crawlerapp", @"../crawler-app", "dev")
    .WithHttpEndpoint(port: 3014, env: "PORT")
    .WithPnpmPackageInstallation()
    .WithReference(crawlerApi)
    .WithExternalHttpEndpoints()
    .WithReference(keycloak).WaitFor(keycloak);


if (OperatingSystem.IsWindows())
{
    builder.AddProject<Projects.WinFormsApp>("winformsclient")
        .WithReference(orderingApi).WaitFor(orderingApi)
        .WithReference(orderingdb).WaitFor(orderingdb)
        .WithExplicitStart()
        .ExcludeFromManifest();

    builder.AddProject<Projects.ModernCSharp_WPFApp>("wpfclient")
        .WithReference(orderingApi).WaitFor(orderingApi)
        .WithReference(orderingdb).WaitFor(orderingdb)
        .WithExplicitStart()
        .ExcludeFromManifest();
}


webApp.WithEnvironment("CallBackUrl", webApp.GetEndpoint("https"));


builder.Build().Run();


static bool ShouldUseHttpForEndpoints()
{
    const string EnvVarName = "MODERNCSHARP_USE_HTTP_ENDPOINTS";
    var envValue = Environment.GetEnvironmentVariable(EnvVarName);

    // Attempt to parse the environment variable value; return true if it's exactly "1".
    return int.TryParse(envValue, out var result) && result == 1;
}
