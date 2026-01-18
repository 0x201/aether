var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddApplicationService();
builder.Services.AddSignalR();
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
