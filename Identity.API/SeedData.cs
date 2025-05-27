
using Duende.IdentityServer.EntityFramework.DbContexts;
using Duende.IdentityServer.EntityFramework.Mappers;
using Duende.IdentityServer.Models;

namespace ModernCSharp.Identity.API;

public class ConfigurationSeed(ILogger<ConfigurationSeed> logger, IConfiguration configuration) : IDbSeeder<ConfigurationDbContext>
{
    public async Task SeedAsync(ConfigurationDbContext context)
    {
        await context.Database.MigrateAsync();

        EnsureSeedData(context, logger, configuration);
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

public class PersistedGrantSeed(ILogger<PersistedGrantSeed> logger) : IDbSeeder<PersistedGrantDbContext>
{
    public async Task SeedAsync(PersistedGrantDbContext context)
    {
        logger.LogInformation("Start to migrate Persisted Grant");
        await context.Database.MigrateAsync();
        logger.LogInformation("Migration Persisted Grant completed");
    }
}
