using ModernCSharp.Ordering.API;
using ModernCSharp.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();
builder.AddApplicationService();
// Add services to the container.
builder.Services.AddProblemDetails();

var withApiVersioning = builder.Services.AddApiVersioning();
builder.AddDefaultOpenApi(withApiVersioning);

var app = builder.Build();

app.MapDefaultEndpoints();

var orders = app.NewVersionedApi("Orders");
orders.MapOrdersApiV1().RequireAuthorization();

app.UseDefaultOpenApi();
app.Run();
