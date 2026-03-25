using ModernCSharp.Ordering.OrderProcessor.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddZLoggerConsole(options =>
{
    options.UseJsonFormatter();
});

builder.Services.AddProblemDetails();

builder.AddServiceDefaults();

builder.AddApplicationService();

var app = builder.Build();

app.MapDefaultEndpoints();

app.Run();
