using System.Security.Claims;

using Aether.Ordering.Application.Common.Interfaces;

namespace Aether.Ordering.OrderProcessor;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : IUser
{
    public string Id => httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
}
