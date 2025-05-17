using Duende.IdentityServer.EntityFramework.DbContexts;
using Duende.IdentityServer.EntityFramework.Mappers;
using Duende.IdentityServer.Models;

using Microsoft.EntityFrameworkCore;

namespace ModernCSharp.Identity.API;

public class SeedData
{
    public static void EnsureSeedData(WebApplication app)
    {
        using var scope = app.Services.GetRequiredService<IServiceScopeFactory>().CreateScope();
        scope.ServiceProvider.GetRequiredService<PersistedGrantDbContext>().Database.Migrate();

        var context = scope.ServiceProvider.GetRequiredService<ConfigurationDbContext>();
        context.Database.Migrate();
        EnsureSeedData(context, app.Logger, app.Configuration);
    }

    private static void EnsureSeedData(ConfigurationDbContext context, ILogger logger, IConfiguration configuration)
    {
        if (!context.Clients.Any())
        {
            logger.LogDebug("Clients being populated");
            foreach (var client in Config.GetClients(configuration).ToList())
            {
                context.Clients.Add(client.ToEntity());
            }
            context.SaveChanges();
        }
        else
        {
            logger.LogDebug("Clients already populated");
        }

        if (!context.IdentityResources.Any())
        {
            logger.LogDebug("IdentityResources being populated");
            foreach (var resource in Config.IdentityResources.ToList())
            {
                context.IdentityResources.Add(resource.ToEntity());
            }
            context.SaveChanges();
        }
        else
        {
            logger.LogDebug("IdentityResources already populated");
        }

        if (!context.ApiScopes.Any())
        {
            logger.LogDebug("ApiScopes being populated");
            foreach (var resource in Config.ApiScopes.ToList())
            {
                context.ApiScopes.Add(resource.ToEntity());
            }
            context.SaveChanges();
        }
        else
        {
            logger.LogDebug("ApiScopes already populated");
        }

        if (!context.IdentityProviders.Any())
        {
            logger.LogDebug("OIDC IdentityProviders being populated");
            context.IdentityProviders.Add(new OidcProvider
            {
                Scheme = "demoidsrv",
                DisplayName = "IdentityServer",
                Authority = "https://demo.duendesoftware.com",
                ClientId = "login",
            }.ToEntity());
            context.SaveChanges();
        }
        else
        {
            logger.LogDebug("OIDC IdentityProviders already populated");
        }
    }
}
