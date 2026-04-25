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

var withApiVersioning = builder.Services.AddApiVersioning();
builder.AddDefaultOpenApi(withApiVersioning);

var app = builder.Build();

app.MapDefaultEndpoints();

app.MapDanmakuApi();

app.UseDefaultOpenApi();

app.MapHub<DyDanmakuHub>("/danmaku-hub");
app.Run();
