using ModernCSharp.Identity.API;

var builder = WebApplication.CreateBuilder(args);

var app = builder
    .ConfigureServices()
    .ConfigurePipeline();

// this seeding is only for the template to bootstrap the DB and users.
// in production you will likely want a different approach.
if (args.Contains("/seed"))
{
    app.Logger.LogInformation("Seeding database...");
    SeedData.EnsureSeedData(app);
    app.Logger.LogInformation("Done seeding database. Exiting.");
    return;
}

app.Run();
