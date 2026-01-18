using ModernCSharp.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

var corsAllowOrigins = builder.Configuration.GetSection("Cors:AllowOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", (policy) =>
    {
        policy.WithOrigins(corsAllowOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
builder.Services.AddSignalR();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient();
builder.Services.AddProblemDetails();
builder.AddDefaultOpenApi();
builder.Services.AddApiVersioningAndDocumentation();
builder.AddApplicationService();

var app = builder.Build();

app.UseCors("AllowAll");
app.MapDefaultEndpoints();
app.UseDefaultOpenApi();
app.MapDanmakuApi();
app.MapHub<DyDanmakuHub>("/danmaku-hub");
app.Run();
