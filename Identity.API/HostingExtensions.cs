using ModernCSharp.Identity.API.Pages;

namespace ModernCSharp.Identity.API;

internal static class HostingExtensions
{
    public static WebApplication ConfigureServices(this WebApplicationBuilder builder)
    {
        builder.AddServiceDefaults();

        builder.Services.AddRazorPages();

        builder.AddSqlServerDbContext<ApplicationDbContext>("identitydb");

        builder.Services.AddMigration<ApplicationDbContext, UserSeed>();

        builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        builder.Services.AddIdentityServer(options =>
        {
            options.Authentication.CookieLifetime = TimeSpan.FromHours(2);

            options.Events.RaiseErrorEvents = true;
            options.Events.RaiseInformationEvents = true;
            options.Events.RaiseFailureEvents = true;
            options.Events.RaiseSuccessEvents = true;
        })
        .AddInMemoryIdentityResources(Config.IdentityResources)
        .AddTestUsers(TestUsers.Users)
        .AddInMemoryApiScopes(Config.ApiScopes)
        .AddInMemoryApiResources(Config.ApiResources)
        .AddInMemoryClients(Config.GetClients(builder.Configuration))
        .AddAspNetIdentity<ApplicationUser>()
        .AddDeveloperSigningCredential();

        builder.Services.AddTransient<IProfileService, ProfileService>();
        builder.Services.AddTransient<ILoginService<ApplicationUser>, EFLoginService>();
        builder.Services.AddTransient<IRedirectService, RedirectService>();
        return builder.Build();
    }

    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
        app.UseStaticFiles();

        app.UseCookiePolicy(new CookiePolicyOptions { MinimumSameSitePolicy = SameSiteMode.Lax });
        app.UseRouting();
        app.UseIdentityServer();
        app.UseAuthorization();

        app.MapRazorPages().RequireAuthorization();

        return app;
    }
}
