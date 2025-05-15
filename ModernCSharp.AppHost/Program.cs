var builder = DistributedApplication.CreateBuilder(args);


var cache = builder.AddRedis("cache");

var rabbitmqUsername = builder.AddParameter("eventbus-username", secret: true);
var rabbitmqPassword = builder.AddParameter("eventbus-password", secret: true);
var rabbitmq = builder.AddRabbitMQ("eventbus", userName: rabbitmqUsername, password: rabbitmqPassword)
                      .WithLifetime(ContainerLifetime.Persistent)
                      .WithManagementPlugin();

var sqlserverPwd = builder.AddParameter("sqlserver-password", secret: true);
var sqlserver = builder.AddSqlServer("sqlserver", password: sqlserverPwd)
                       .WithLifetime(ContainerLifetime.Persistent);
var identityDb = sqlserver.AddDatabase("identitydb");
var orderDb = sqlserver.AddDatabase("orderingdb");

//var launchProfileName = ShouldUseHttpForEndpoints() ? "http" : "https";

var identityApi = builder.AddProject<Projects.Identity_API>("identity-api")
    .WithExternalHttpEndpoints()
    .WithReference(identityDb);

var apiService = builder.AddProject<Projects.Ordering_API>("apiservice")
    .WithReference(rabbitmq)
    .WaitFor(rabbitmq);

builder.AddProject<Projects.OrderProcessor>("orderprocessor")
    .WithReference(cache).WaitFor(cache)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderDb);


var webApp = builder.AddProject<Projects.ModernCSharp_Web>("webapp")
    .WithExternalHttpEndpoints()
    .WithReference(cache).WaitFor(cache)
    .WithReference(apiService).WaitFor(apiService);

//identityApi.WithEnvironment("OrderingApiClient", apiService.GetEndpoint("http"))
//    .WithEnvironment("WebAppClient", webApp.GetEndpoint(launchProfileName));


builder.AddProject<Projects.Catalog_API>("catalog-api");

//identityApi.WithEnvironment("OrderingApiClient", apiService.GetEndpoint("http"))
//    .WithEnvironment("WebAppClient", webApp.GetEndpoint(launchProfileName));


builder.Build().Run();


static bool ShouldUseHttpForEndpoints()
{
    const string EnvVarName = "MODERNCSHARP_USE_HTTP_ENDPOINTS";
    var envValue = Environment.GetEnvironmentVariable(EnvVarName);

    // Attempt to parse the environment variable value; return true if it's exactly "1".
    return int.TryParse(envValue, out var result) && result == 1;
}
