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

//var launchProfileName = ShouldUseHttpForEndpoints() ? "http" : "https";

var identityApi = builder.AddProject<Projects.Identity_API>("identity-api")
    .WithExternalHttpEndpoints()
    .WithReference(identityDb);

var orderingApi = builder.AddProject<Projects.Ordering_API>("ordering-api")
    .WithReference(rabbitmq)
    .WaitFor(rabbitmq);

builder.AddProject<Projects.OrderProcessor>("order-processor")
    .WithReference(cache).WaitFor(cache)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderDb);


var webApp = builder.AddProject<Projects.ModernCSharp_Web>("webapp")
    .WithExternalHttpEndpoints()
    .WithReference(cache).WaitFor(cache)
    .WithReference(orderingApi).WaitFor(orderingApi);

//identityApi.WithEnvironment("OrderingApiClient", apiService.GetEndpoint("http"))
//    .WithEnvironment("WebAppClient", webApp.GetEndpoint(launchProfileName));


builder.AddProject<Projects.Catalog_API>("catalog-api");

//identityApi.WithEnvironment("OrderingApiClient", apiService.GetEndpoint("http"))
//    .WithEnvironment("WebAppClient", webApp.GetEndpoint(launchProfileName));


builder.Build().Run();


//static bool ShouldUseHttpForEndpoints()
//{
//    const string EnvVarName = "MODERNCSHARP_USE_HTTP_ENDPOINTS";
//    var envValue = Environment.GetEnvironmentVariable(EnvVarName);

//    // Attempt to parse the environment variable value; return true if it's exactly "1".
//    return int.TryParse(envValue, out var result) && result == 1;
//}
