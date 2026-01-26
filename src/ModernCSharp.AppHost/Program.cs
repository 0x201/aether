using Microsoft.Extensions.Configuration;
using ModernCSharp.AppHost.Extensions;

var builder = DistributedApplication.CreateBuilder(args);

builder.AddDockerComposeEnvironment("env");

var dataMountPath = builder.Configuration.GetSection("Docker:DataMountPath").Get<string>() ?? @"/dockerdata";
var redisDataPath = Path.Combine(dataMountPath, "redis");
var postgresDataPath = Path.Combine(dataMountPath, "postgres");
var rabbitmqDataPath = Path.Combine(dataMountPath, "rabbitmq");
var keycloakDataPath = Path.Combine(dataMountPath, "keycloak");

var redis = builder.AddRedis("redis", port: 6379)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithBindMount(redisDataPath, "/data")
    .WithContainerName("redis");

var rabbitmq = builder.AddRabbitMQ("eventbus", port: 5672)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithManagementPlugin(port: 15672)
    .WithBindMount(rabbitmqDataPath, "/var/lib/rabbitmq")
    .WithContainerName("eventbus");

var postgres = builder.AddPostgres("postgres", port: 5432)
    .WithImageTag("latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithBindMount(Path.GetFullPath(postgresDataPath), "/var/lib/postgresql")
    .WithContainerName("postgres");

var keycloak = builder.AddKeycloak("keycloak", port: 8080)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithBindMount(keycloakDataPath, "/opt/keycloak/data")
    .WithRealmImport("./realm.json")
    .WithContainerName("keycloak");

var bookstoredb = postgres.AddDatabase("bookstoredb");
var orderingdb = postgres.AddDatabase("orderingdb");
var dydanmakudb = postgres.AddDatabase("dydanmakudb");

var launchProfileName = ShouldUseHttpForEndpoints() ? "http" : "https";

var orderingApi = builder.AddProject<Projects.Ordering_API>("orderingapi")
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderingdb).WaitFor(orderingdb)
    .WithPostgresSchema(orderingdb, "ordering")
    .WithHttpHealthCheck("/health")
    .WithReference(keycloak).WaitFor(keycloak);

var dydanmakuApi = builder.AddProject<Projects.DyDanmaku_API>("dydanmakuapi")
    .WithReference(dydanmakudb).WaitFor(dydanmakudb)
    .WithPostgresSchema(dydanmakudb, "dydanmaku")
    .WithReference(redis).WaitFor(redis)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithHttpHealthCheck("/health");

builder.AddProject<Projects.OrderProcessor>("orderprocessor")
    .WithReference(redis)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(orderingdb)
    .WaitFor(orderingApi);

var webApp = builder.AddProject<Projects.ModernCSharp_WebApp>("webapp")
    .WithExternalHttpEndpoints()
    .WithReference(orderingApi)
    .WithReference(rabbitmq).WaitFor(rabbitmq);

var bookStoreApi = builder.AddJavaScriptApp("bookstoreapi", @"../bookstore-api", "start:dev")
    .WithPnpm()
    .WithHttpEndpoint(port: 3011, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(redis).WaitFor(redis)
    .WithReference(keycloak).WaitFor(keycloak)
    .WithReference(bookstoredb).WaitFor(bookstoredb);

var bookstoreApiHttpEndpoint = bookStoreApi.GetEndpoint("http");
bookStoreApi.WithUrl($"{bookstoreApiHttpEndpoint}/scalar", "Book Store API Scalar Reference");

builder.AddJavaScriptApp("bookstoreapp", @"../bookstore-app", "start")
    .WithPnpm()
    .WithHttpEndpoint(port: 3012, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(bookStoreApi)
    .WithReference(keycloak).WaitFor(keycloak);

var danmakuanalytics = builder.AddPythonApp("danmakuanalytics", @"../dydanmaku-analytics", "main.py")
    .WithUv()
    .WithHttpEndpoint(port: 8000, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(redis).WaitFor(redis)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(dydanmakudb).WaitFor(dydanmakudb);

danmakuanalytics.WithUrl($"{danmakuanalytics.GetEndpoint("http")}/scalar", "Douyu Danmaku Analytics API Docs");

builder.AddJavaScriptApp("danmakuviewer", @"../dydanmaku-viewer")
    .WithPnpm()
    .WithHttpEndpoint(port: 3015, env: "PORT")
    .WithReference(dydanmakuApi)
    .WithExternalHttpEndpoints();

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
