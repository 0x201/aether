using Workflow.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddApplicationServices();

builder.Services.AddProblemDetails();

var withApiVersioning = builder.Services.AddApiVersioning();
builder.AddDefaultOpenApi(withApiVersioning);

builder.Services.AddSignalR();

var app = builder.Build();

app.MapDefaultEndpoints();

var workflow = app.NewVersionedApi("Workflow");
workflow.MapWorkflowsApiV1();

var etl = app.NewVersionedApi("Etl");
etl.MapEtlApiV1();

app.MapHub<JobStatusHub>("/api/jobstatus");
app.UseDefaultOpenApi();
app.Run();
