using ModernCSharp.OrderProcessor.Extensions;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.AddServiceDefaults();
builder.AddApplicationService();

var app = builder.Build();

app.MapDefaultEndpoints();

app.Run();