var builder = DistributedApplication.CreateBuilder(args);

var cache = builder.AddRedis("cache");

var rabbitmqUsername = builder.AddParameter("eventbus-username", secret: true);
var rabbitmqPassword = builder.AddParameter("eventbus-password", secret: true);
var rabbitmq = builder.AddRabbitMQ("eventbus", userName: rabbitmqUsername, password: rabbitmqPassword)
                      .WithLifetime(ContainerLifetime.Persistent)
                      .WithManagementPlugin();

var sqlServerPwd = builder.AddParameter("sqlserver-password", secret: true);
var sqlServer = builder.AddSqlServer("sqlserver", password: sqlServerPwd)
                       .WithLifetime(ContainerLifetime.Persistent);
var identityDb = sqlServer.AddDatabase("identitydb");
var orderDb = sqlServer.AddDatabase("orderingdb");

var launchProfileName = ShouldUseHttpForEndpoints() ? "http" : "https";

var identityApi = builder.AddProject<Projects.Identity_API>("identity-api", "https")
    .WithExternalHttpEndpoints()
    .WithReference(identityDb);

var identityEndpoint = identityApi.GetEndpoint("https");

var orderingApi = builder.AddProject<Projects.Ordering_API>("ordering-api")
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderDb).WaitFor(orderDb)
    .WithHttpHealthCheck("/health")
    .WithEnvironment("Identity__Url", identityEndpoint);

builder.AddProject<Projects.OrderProcessor>("order-processor")
    .WithReference(cache).WaitFor(cache)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderDb)
    .WaitFor(orderingApi);


var webApp = builder.AddProject<Projects.ModernCSharp_Web>("webapp")
    .WithExternalHttpEndpoints()
    .WithReference(cache).WaitFor(cache)
    .WithReference(orderingApi).WaitFor(orderingApi)
    .WithEnvironment("IdentityUrl", identityEndpoint);

var nestjsApp = builder.AddPnpmApp("nestjs-app", @"..\..\nestjs-demo", "start")
    .WithHttpEndpoint(port: 3000, isProxied: false)
    .WithExternalHttpEndpoints();

nestjsApp.WithUrl($"{nestjsApp.GetEndpoint("http")}/docs", "NestJs App Swagger Docs");

var viteVueApp = builder.AddPnpmApp("vite-vue-app", @"..\..\vite-vue-app", "dev")
    .WithHttpEndpoint(port: 5173, isProxied: false)
    .WithExternalHttpEndpoints()
    .WithReference(orderingApi);

#pragma warning disable ASPIREHOSTINGPYTHON001 
var fastapiApp = builder.AddPythonApp("fastapi-app", @"..\..\fastapi-demo", "main.py")
    .WithHttpEndpoint(port: 8000, isProxied: false)
    .WithExternalHttpEndpoints();
#pragma warning restore ASPIREHOSTINGPYTHON001

fastapiApp.WithUrl($"{fastapiApp.GetEndpoint("http")}/docs", "FastApi App Swagger Docs");


webApp.WithEnvironment("CallBackUrl", webApp.GetEndpoint("https"));
identityApi.WithEnvironment("OrderingApiClient", orderingApi.GetEndpoint("https"))
           .WithEnvironment("WebAppClient", webApp.GetEndpoint("https"));


builder.AddProject<Projects.Catalog_API>("catalog-api");


builder.Build().Run();


static bool ShouldUseHttpForEndpoints()
{
    const string EnvVarName = "MODERNCSHARP_USE_HTTP_ENDPOINTS";
    var envValue = Environment.GetEnvironmentVariable(EnvVarName);

    // Attempt to parse the environment variable value; return true if it's exactly "1".
    return int.TryParse(envValue, out var result) && result == 1;
}
