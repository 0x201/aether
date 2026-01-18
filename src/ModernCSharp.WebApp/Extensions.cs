using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server;
using Microsoft.IdentityModel.JsonWebTokens;

using ModernCSharp.EventBus.Abstractions;
using ModernCSharp.ServiceDefaults;
using ModernCSharp.WebApp.Services;

namespace ModernCSharp.WebApp;

public static class Extensions
{
    public static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        builder.AddAuthenticationServices();

        builder.AddRabbitMqEventBus("eventbus")
            .AddEventBusSubscriptions();

        builder.Services.AddSingleton<OrderStatusNotificationService>();

        builder.Services.AddHttpClient<OrderingService>(client => client.BaseAddress = new("http://ordering-api"))
            .AddApiVersion(1.0)
            .AddAuthToken();

    }

    public static void AddEventBusSubscriptions(this IEventBusBuilder eventBus)
    {
        //eventBus.AddSubscription<>();
    }

    public static void AddAuthenticationServices(this IHostApplicationBuilder builder)
    {
        var configuration = builder.Configuration;
        var services = builder.Services;

        JsonWebTokenHandler.DefaultInboundClaimTypeMap.Remove("sub");

        var identityUrl = configuration.GetRequiredValue("Auth:IdentityUrl");
        var callBackUrl = configuration.GetRequiredValue("Auth:CallbackUrl");
        var sessionCookieLifetime = configuration.GetValue("Auth:SessionCookieLifetimeMinutes", 60);
        var clientId = configuration.GetRequiredValue("Auth:ClientId");
        var clientSecret = configuration.GetRequiredValue("Auth:ClientSecret");

        // Add Authentication services
        services.AddAuthorization();
        services.AddAuthentication(options =>
        {
            options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
        })
        .AddCookie(options => options.ExpireTimeSpan = TimeSpan.FromMinutes(sessionCookieLifetime))
        .AddOpenIdConnect(options =>
        {
            options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.Authority = identityUrl;
            options.SignedOutRedirectUri = callBackUrl;
            options.ClientId = clientId;
            options.ClientSecret = clientSecret;
            options.ResponseType = "code";
            options.SaveTokens = true;
            options.GetClaimsFromUserInfoEndpoint = true;
            options.RequireHttpsMetadata = false;
            options.Scope.Add("openid");
            options.Scope.Add("profile");
            options.Scope.Add("orders");
            //options.Scope.Add("basket");
        });

        // Blazor auth services
        services.AddScoped<AuthenticationStateProvider, ServerAuthenticationStateProvider>();
        services.AddCascadingAuthenticationState();
    }

    public static async Task<string?> GetBuyerIdAsync(this AuthenticationStateProvider authenticationStateProvider)
    {
        var authState = await authenticationStateProvider.GetAuthenticationStateAsync();
        var user = authState.User;
        return user.FindFirst("sub")?.Value;
    }

    public static async Task<string?> GetUserNameAsync(this AuthenticationStateProvider authenticationStateProvider)
    {
        var authState = await authenticationStateProvider.GetAuthenticationStateAsync();
        var user = authState.User;
        return user.FindFirst("name")?.Value;
    }
}
