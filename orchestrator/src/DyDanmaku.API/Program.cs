using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddZLoggerConsole(options => 
{
    options.UseJsonFormatter(formatter =>
    {
        // formatter.IncludeProperties = IncludeProperties.Timestamp 
        //     | IncludeProperties.LogLevel 
        //     | IncludeProperties.Message 
        //     | IncludeProperties.ParameterKeyValues;
    });
});

builder.AddServiceDefaults();
builder.AddApplicationService();
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddHttpClient();
builder.Services.AddProblemDetails();

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context => 
    RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? context.Request.Headers.Host.ToString(),
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromSeconds(60),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0,
        }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var withApiVersioning = builder.Services.AddApiVersioning();
builder.AddDefaultOpenApi(withApiVersioning);

var app = builder.Build();

app.UseRateLimiter();

app.MapDefaultEndpoints();

app.MapDanmakuApi();

app.UseDefaultOpenApi();

app.MapHub<DyDanmakuHub>("/danmaku-hub");
app.Run();
