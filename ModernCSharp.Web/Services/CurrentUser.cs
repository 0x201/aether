using System.Security.Claims;

using ModernCSharp.ApplicationCore.Common.Interfaces;

namespace ModernCSharp.Web.Services;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : IUser
{
    public string? Id => httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
}
