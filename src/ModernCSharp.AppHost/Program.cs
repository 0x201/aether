var builder = DistributedApplication.CreateBuilder(args);

#pragma warning disable ASPIREPROXYENDPOINTS001
var redis = builder.AddRedis("redis", port: 6379)
                   .WithLifetime(ContainerLifetime.Persistent)
                   .WithEndpointProxySupport(false)
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
                      .WithEndpointProxySupport(false)
                      .WithManagementPlugin()
                      .WithDataVolume()
                      .WithContainerName("eventbus");

var sqlServer = builder.AddSqlServer("sqlserver", port: 14330)
                       .WithEndpointProxySupport(false)
                       .WithLifetime(ContainerLifetime.Persistent)
                       .WithDataVolume()
                       .WithContainerName("sql-server");

var bookstoreDb = sqlServer.AddDatabase("bookstoredb");
var identityDb = sqlServer.AddDatabase("identitydb");
var orderDb = sqlServer.AddDatabase("orderingdb");
var catalogDb = sqlServer.AddDatabase("catalogdb");

var launchProfileName = ShouldUseHttpForEndpoints() ? "http" : "https";

var identityApi = builder.AddProject<Projects.Identity_API>("identity-api", "https")
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

var nestjsApp = builder.AddPnpmApp("nestjs-app", @"..\ClientApp\nestjs-demo", "start")
    .WithHttpEndpoint(port: 3000, isProxied: false)
    .WithExternalHttpEndpoints()
    .WithReference(bookstoreDb).WaitFor(bookstoreDb);

nestjsApp.WithUrl($"{nestjsApp.GetEndpoint("http")}/docs", "NestJs App Swagger Docs");

var viteVueApp = builder.AddPnpmApp("vite-vue-app", @"..\ClientApp\vite-vue-app", "dev")
    .WithHttpEndpoint(port: 3001, isProxied: false)
    .WithExternalHttpEndpoints()
    .WithReference(orderingApi);

var viteReactApp = builder.AddPnpmApp("vite-react-app", @"..\ClientApp\vite-react-app", "dev")
    .WithHttpEndpoint(port: 3002, isProxied: false)
    .WithExternalHttpEndpoints()
    .WithReference(orderingApi);

var angularApp = builder.AddPnpmApp("angular-app", @"..\ClientApp\angular-app", "start")
    .WithHttpEndpoint(port: 3003, isProxied: false)
    .WithExternalHttpEndpoints()
    .WithReference(orderingApi);

#pragma warning disable ASPIREHOSTINGPYTHON001 
var fastapiApp = builder.AddPythonApp("fastapi-app", @"..\ClientApp\fastapi-demo", "main.py")
    .WithHttpEndpoint(port: 8000, isProxied: false)
    .WithExternalHttpEndpoints()
    .WithReference(bookstoreDb).WaitFor(bookstoreDb);
#pragma warning restore ASPIREHOSTINGPYTHON001

fastapiApp.WithUrl($"{fastapiApp.GetEndpoint("http")}/docs", "FastApi App Swagger Docs");


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
