namespace ModernCSharp.Ordering.API.Infrastructure.Services;

public class IdentityService(HttpContextAccessor context) : IIdentityService
{
    public string GetUserIdentity()
    {
        return context.HttpContext?.User.FindFirst("sub")?.Value;
    }

    public string GetUserName()
    {
        return context.HttpContext?.User.Identity?.Name;
    }
}
