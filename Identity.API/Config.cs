namespace ModernCSharp.Identity.API;

public static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
        new IdentityResource[]
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
        };

    public static IEnumerable<ApiScope> ApiScopes =>
        new ApiScope[]
        {
            new ApiScope("orders", "Orders Service"),
            new ApiScope("basket", "Basket Service"),
        };

    public static IEnumerable<ApiResource> ApiResources =>
        [
            new ApiResource("orders", "Orders Service"),
            new ApiResource("basket", "Basket Service"),
        ];

    public static IEnumerable<Client> GetClients(IConfiguration configuration) =>
        [
            new Client
            {
                ClientId = "webapp",
                ClientName = "WebApp Client",
                ClientSecrets = { new Secret("511536EF-F270-4058-80CA-1C89C192F69A".Sha256()) },
                ClientUri = $"{configuration["WebAppClient"]}",                             // public uri of the client
                AllowedGrantTypes = GrantTypes.Code,
                AllowAccessTokensViaBrowser = false,
                RequireConsent = false,
                AllowOfflineAccess = true,
                AlwaysIncludeUserClaimsInIdToken = true,
                RequirePkce = false,
                RedirectUris =
                [
                    $"{configuration["WebAppClient"]}/signin-oidc"
                ],
                PostLogoutRedirectUris =
                [
                    $"{configuration["WebAppClient"]}/signout-callback-oidc"
                ],
                AllowedScopes =
                [
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.OfflineAccess,
                    "orders",
                    "basket",
                    "webshoppingagg",
                    "webhooks"
                ],
                AccessTokenLifetime = 60*60*2, // 2 hours
                IdentityTokenLifetime= 60*60*2 // 2 hours
            },
            new Client
            {
                 ClientId = "orderingswaggerui",
                 ClientName = "Ordering Swagger UI",
                 AllowedGrantTypes = GrantTypes.Implicit,
                 AllowAccessTokensViaBrowser = true,
                 RedirectUris = { $"{configuration["OrderingApiClient"]}/swagger/oauth2-redirect.html" },
                 PostLogoutRedirectUris = { $"{configuration["OrderingApiClient"]}/swagger/" },
                 AllowedScopes =
                 {
                     "orders"
                 }
            },
        ];
}
