using ModernCSharp.ApplicationCore.Services;
using ModernCSharp.Infrastructure;
using ModernCSharp.OrderProcessor.Services;

using RabbitMQ.Client;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();

var rabbitMqConnection = builder.Configuration.GetConnectionString("messaging");

builder.Services.AddSingleton<IConnectionFactory>(new ConnectionFactory
{
    Uri = new Uri(rabbitMqConnection)
});

builder.AddServiceDefaults();
builder.AddRedisOutputCache("cache");

builder.Services.AddSingleton<OrderService>();
builder.Services.AddFileContexts();
builder.Services.AddFileImporters();
builder.Services.AddFileExporters();

builder.Services.AddHostedService<OrderWorker>();


var app = builder.Build();

app.MapDefaultEndpoints();

app.Run();