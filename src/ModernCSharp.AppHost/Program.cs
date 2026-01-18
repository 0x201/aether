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

var postgres = builder.AddPostgres("postgres", port: 5432)
    .WithImageTag("latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithContainerName("postgres");

var keycloak = builder.AddKeycloak("keycloak", port: 8080)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithDataVolume()
    .WithRealmImport("./realm.json")
    .WithContainerName("keycloak");

var bookstoredb = postgres.AddDatabase("bookstoredb");
var orderingdb = postgres.AddDatabase("orderingdb");
var catalogdb = postgres.AddDatabase("catalogdb");
var dydanmakudb = postgres.AddDatabase("dydanmakudb");


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

var dydanmakuApi = builder.AddProject<Projects.DyDanmaku_API>("dydanmakuapi")
    .WithReference(dydanmakudb).WaitFor(dydanmakudb)
    .WithHttpHealthCheck("/health");

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

var bookStoreApi = builder.AddJavaScriptApp("bookstoreapi", @"../bookstore-api", "start:dev")
    .WithPnpm()
    .WithHttpEndpoint(port: 3011, env: "PORT")
    .WithExternalHttpEndpoints()
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

var crawlerApi = builder.AddPythonApp("crawlerapi", @"../crawler-api", "main.py")
    .WithUv()
    .WithHttpEndpoint(port: 3013, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithOtlpExporter()
    .WithReference(bookstoredb).WaitFor(bookstoredb)
    .WithReference(keycloak).WaitFor(keycloak);

crawlerApi.WithUrl($"{crawlerApi.GetEndpoint("http")}/scalar", "Crawler API Scalar Reference");

var dydanmakuAnalysisApi = builder.AddPythonApp("danmakuanalysisapi", @"../dydanmaku-api", "main.py")
    .WithUv()
    .WithHttpEndpoint(port: 8000, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(dydanmakudb).WaitFor(dydanmakudb);

dydanmakuAnalysisApi.WithUrl($"{dydanmakuAnalysisApi.GetEndpoint("http")}/docs", "Douyu Danmaku Analysis API Docs");

builder.AddJavaScriptApp("crawlerapp", @"../crawler-app")
    .WithPnpm()
    .WithHttpEndpoint(port: 3014, env: "PORT")
    .WithReference(crawlerApi)
    .WithExternalHttpEndpoints()
    .WithReference(keycloak).WaitFor(keycloak);

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
