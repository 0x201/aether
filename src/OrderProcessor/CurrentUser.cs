using System.Security.Claims;

using ModernCSharp.Ordering.Application.Common.Interfaces;

namespace ModernCSharp.Ordering.OrderProcessor;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : IUser
{
    public string Id => httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
}
