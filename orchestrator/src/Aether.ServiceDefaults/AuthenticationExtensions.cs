using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Aether.ServiceDefaults;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddDefaultAuthentication(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;
        var configuration = builder.Configuration;

        var identitySection = configuration.GetSection("Identity");

        if (!identitySection.Exists())
        {
            return services;
        }

        JsonWebTokenHandler.DefaultInboundClaimTypeMap.Remove("sub");

        _ = services.AddAuthentication()
            .AddJwtBearer(options =>
            {
                var identityUrl = identitySection.GetRequiredValue("Url");
                var audience = identitySection.GetRequiredValue("Audience");

                options.Authority = identityUrl;
                options.RequireHttpsMetadata = false;
                options.Audience = audience;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateAudience = false,
                    ValidAudience = audience,
                    ValidateIssuer = true,
                    ValidIssuers = [identityUrl],
                    ValidateIssuerSigningKey = true,
                    NameClaimType = "name",
                    RoleClaimType = "role"
                };

                // Support for Keycloak roles in the token
                options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        var issuer = context.SecurityToken.Issuer;
                        // Map Keycloak roles to claims
                        var roleClaims = context?.Principal?.FindAll("resource_access").Where(c => c.Value.Contains(audience));
                        if (roleClaims != null)
                        {
                            var claims = new List<System.Security.Claims.Claim>();
                            foreach (var roleClaim in roleClaims)
                            {
                                var clientId = roleClaim.Value[..roleClaim.Value.IndexOf(":")];
                                var rolesJson = roleClaim.Value[(roleClaim.Value.IndexOf(":") + 1)..];
                                // In a real implementation, you would parse the roles from the JSON
                                // and add them as role claims
                            }
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization();

        return services;
    }
}