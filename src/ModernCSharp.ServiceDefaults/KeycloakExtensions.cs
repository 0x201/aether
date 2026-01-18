using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;

namespace ModernCSharp.ServiceDefaults;

public static class KeycloakExtensions
{
    public static IServiceCollection AddKeycloakAuthentication(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;
        var configuration = builder.Configuration;

        var identitySection = configuration.GetSection("Identity");

        if (!identitySection.Exists())
        {
            return services;
        }

        JsonWebTokenHandler.DefaultInboundClaimTypeMap.Clear();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
                    NameClaimType = "preferred_username",
                    RoleClaimType = ClaimTypes.Role
                };

                // Support for Keycloak roles in the token
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        if (context.Principal?.Identity is not ClaimsIdentity claimsIdentity)
                            return System.Threading.Tasks.Task.CompletedTask;

                        // Extract roles from Keycloak's resource_access claim
                        var resourceAccessClaim = context.Principal.FindFirst("resource_access");
                        if (resourceAccessClaim != null && !string.IsNullOrEmpty(resourceAccessClaim.Value))
                        {
                            try
                            {
                                // Parse the resource_access JSON
                                var resourceAccess = JsonDocument.Parse(resourceAccessClaim.Value);
                                if (resourceAccess.RootElement.TryGetProperty(audience, out var clientRolesElement) &&
                                    clientRolesElement.TryGetProperty("roles", out var rolesElement))
                                {
                                    foreach (var role in rolesElement.EnumerateArray())
                                    {
                                        claimsIdentity.AddClaim(new Claim(ClaimTypes.Role, role.GetString()));
                                    }
                                }
                            }
                            catch
                            {
                                // Ignore parsing errors
                            }
                        }

                        // Also check for realm roles
                        var realmAccessClaim = context.Principal.FindFirst("realm_access");
                        if (realmAccessClaim != null && !string.IsNullOrEmpty(realmAccessClaim.Value))
                        {
                            try
                            {
                                // Parse the realm_access JSON
                                var realmAccess = JsonDocument.Parse(realmAccessClaim.Value);
                                if (realmAccess.RootElement.TryGetProperty("roles", out var rolesElement))
                                {
                                    foreach (var role in rolesElement.EnumerateArray())
                                    {
                                        claimsIdentity.AddClaim(new Claim(ClaimTypes.Role, role.GetString()));
                                    }
                                }
                            }
                            catch
                            {
                                // Ignore parsing errors
                            }
                        }

                        return System.Threading.Tasks.Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization();

        return services;
    }
}