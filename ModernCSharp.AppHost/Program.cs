var builder = DistributedApplication.CreateBuilder(args);


var cache = builder.AddRedis("cache");

var rabbitmq = builder.AddRabbitMQ("eventbus");
var sqlserver = builder.AddSqlServer("sqlserver");

var identityDb = sqlserver.AddDatabase("identitydb");
var orderDb = sqlserver.AddDatabase("orderingdb");

var launchProfileName = ShouldUseHttpForEndpoints() ? "http" : "https";

var identityApi = builder.AddProject<Projects.Identity_API>("identity-api", launchProfileName)
    .WithExternalHttpEndpoints()
    .WithReference(identityDb);

var apiService = builder.AddProject<Projects.ModernCSharp_ApiService>("apiservice")
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

identityApi.WithEnvironment("OrderingApiClient", apiService.GetEndpoint("http"))
    .WithEnvironment("WebAppClient", webApp.GetEndpoint(launchProfileName));


builder.Build().Run();


static bool ShouldUseHttpForEndpoints()
{
    const string EnvVarName = "MODERNCSHARP_USE_HTTP_ENDPOINTS";
    var envValue = Environment.GetEnvironmentVariable(EnvVarName);

    // Attempt to parse the environment variable value; return true if it's exactly "1".
    return int.TryParse(envValue, out var result) && result == 1;
}