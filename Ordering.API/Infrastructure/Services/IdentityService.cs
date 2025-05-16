
using ModernCSharp.Ordering.Application.Common.Interfaces;
using ModernCSharp.Ordering.Application.Common.Models;

namespace ModernCSharp.Ordering.API.Infrastructure.Services;

public class IdentityService(IHttpContextAccessor context) : IIdentityService
{
    public Task<bool> AuthorizeAsync(string userId, string policyName)
    {
        throw new NotImplementedException();
    }

    public Task<(Result Result, string UserId)> CreateUserAsync(string userName, string password)
    {
        throw new NotImplementedException();
    }

    public Task<Result> DeleteUserAsync(string userId)
    {
        throw new NotImplementedException();
    }

    public string GetUserIdentity()
    {
        return context.HttpContext?.User.FindFirst("sub")?.Value;
    }

    public string GetUserName()
    {
        return context.HttpContext?.User.Identity?.Name;
    }

    public Task<string> GetUserNameAsync(string userId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> IsInRoleAsync(string userId, string role)
    {
        throw new NotImplementedException();
    }
}
