using ModernCSharp.Ordering.OrderProcessor.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();

builder.AddServiceDefaults();

builder.AddApplicationService();

builder.Services.AddFileProcessServices();

var app = builder.Build();

app.MapDefaultEndpoints();

app.Run();
