using Microsoft.Extensions.Configuration;
using Aether.AppHost.Extensions;

var builder = DistributedApplication.CreateBuilder(args);

builder.AddDockerComposeEnvironment("env");

var dataMountPath = builder.Configuration.GetSection("Docker:DataMountPath").Get<string>() ?? @"/dockerdata";
var redisDataPath = Path.Combine(dataMountPath, "redis");
var postgresDataPath = Path.Combine(dataMountPath, "postgres");
var rabbitmqDataPath = Path.Combine(dataMountPath, "rabbitmq");
var keycloakDataPath = Path.Combine(dataMountPath, "keycloak");

var redis = builder.AddRedis("redis", port: 6379)
    .WithDataBindMount(redisDataPath)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithContainerName("redis");

var rabbitmq = builder.AddRabbitMQ("eventbus", port: 5672)
    .WithDataBindMount(rabbitmqDataPath)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithManagementPlugin(port: 15672)
    .WithContainerName("eventbus");

var postgres = builder.AddPostgres("postgres", port: 5432)
    //.WithDataBindMount(postgresDataPath)
    .WithBindMount(Path.GetFullPath(postgresDataPath), "/var/lib/postgresql")
    .WithImageTag("latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithContainerName("postgres");

var keycloak = builder.AddKeycloak("keycloak", port: 8080)
    .WithDataBindMount(keycloakDataPath)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithRealmImport("./realm.json")
    .WithContainerName("keycloak")
    .WithOtlpExporter();

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

var webApp = builder.AddProject<Projects.Aether_WebApp>("webapp")
    .WithExternalHttpEndpoints()
    .WithReference(orderingApi)
    .WithReference(rabbitmq).WaitFor(rabbitmq);

var bookStoreApi = builder.AddJavaScriptApp("bookstoreapi", @"../../../bookstore-api", "start")
    .WithPnpm()
    .WithHttpEndpoint(port: 3011, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(redis).WaitFor(redis)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(keycloak).WaitFor(keycloak)
    .WithReference(bookstoredb).WaitFor(bookstoredb);

var bookstoreApiHttpEndpoint = bookStoreApi.GetEndpoint("http");
bookStoreApi.WithUrl($"{bookstoreApiHttpEndpoint}/scalar", "Book Store API Scalar Reference");

builder.AddJavaScriptApp("bookstoreapp", @"../../../bookstore-app", "start")
    .WithPnpm()
    .WithHttpEndpoint(port: 3012, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(bookStoreApi)
    .WithReference(keycloak).WaitFor(keycloak);

builder.AddJavaScriptApp("xapp", @"../../../aether-x-app", "start")
    .WithPnpm()
    .WithHttpEndpoint(port: 3013, env: "PORT")
    .WithExternalHttpEndpoints();

var danmakuanalytics = builder.AddPythonApp("danmakuanalytics", @"../../../dydanmaku-analytics", "main.py")
    .WithUv()
    .WithHttpEndpoint(port: 8000, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(redis).WaitFor(redis)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(dydanmakudb).WaitFor(dydanmakudb);

danmakuanalytics.WithUrl($"{danmakuanalytics.GetEndpoint("http")}/scalar", "Douyu Danmaku Analytics API Docs");

builder.AddJavaScriptApp("danmakuviewer", @"../../../dydanmaku-viewer")
    .WithPnpm()
    .WithHttpEndpoint(port: 3015, env: "PORT")
    .WithReference(dydanmakuApi)
    .WithExternalHttpEndpoints();


var goApi = builder.AddGolangApp(
    name: "go-api",
    workingDirectory: @"../../../go-api")
    .WithHttpEndpoint(port: 3000, env: "PORT");

goApi.WithUrl($"{goApi.GetEndpoint("http")}/scalar", "Go API Docs");

var rustApi = builder.AddRustApp(
    name: "rust-api",
    workingDirectory: @"../../../rust-api")
    .WithHttpEndpoint(port: 3001, env: "PORT");

rustApi.WithUrl($"{rustApi.GetEndpoint("http")}/scalar", "Rust API Docs");

if (OperatingSystem.IsWindows())
{
    builder.AddProject<Projects.WinFormsApp>("winformsclient")
        .WithReference(orderingApi).WaitFor(orderingApi)
        .WithReference(orderingdb).WaitFor(orderingdb)
        .WithExplicitStart()
        .ExcludeFromManifest();

    builder.AddProject<Projects.Aether_WPFApp>("wpfclient")
        .WithReference(orderingApi).WaitFor(orderingApi)
        .WithReference(orderingdb).WaitFor(orderingdb)
        .WithExplicitStart()
        .ExcludeFromManifest();
}

webApp.WithEnvironment("CallBackUrl", webApp.GetEndpoint("https"));

builder.Build().Run();

static bool ShouldUseHttpForEndpoints()
{
    const string EnvVarName = "Aether_USE_HTTP_ENDPOINTS";
    var envValue = Environment.GetEnvironmentVariable(EnvVarName);

    // Attempt to parse the environment variable value; return true if it's exactly "1".
    return int.TryParse(envValue, out var result) && result == 1;
}
