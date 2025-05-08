using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

using ModernCSharp.ApplicationCore.Common.Interfaces;
using ModernCSharp.ApplicationCore.Common.Models;

namespace ModernCSharp.Infrastructure.Identity;

public class IdentityService(
    UserManager<ApplicationUser> userManager,
    IUserClaimsPrincipalFactory<ApplicationUser> userClaimsPrincipalFactory,
    IAuthorizationService authorizationService) : IIdentityService
{
    public async Task<bool> AuthorizeAsync(string userId, string policyName)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return false;
        }

        var principal = await userClaimsPrincipalFactory.CreateAsync(user);

        var result = await authorizationService.AuthorizeAsync(principal, policyName);

        return result.Succeeded;
    }

    public async Task<(Result Result, string UserId)> CreateUserAsync(string userName, string password)
    {
        var user = new ApplicationUser
        {
            UserName = userName,
            Email = userName,
        };

        var result = await userManager.CreateAsync(user, password);
        return (result.ToApplicationResult(), user.Id);
    }

    public async Task<Result> DeleteUserAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);

        return user is not null ? await DeleteUserAsync(user) : Result.Success();
    }

    public async Task<Result> DeleteUserAsync(ApplicationUser user)
    {
        var result = await userManager.DeleteAsync(user);
        return result.ToApplicationResult();
    }

    public async Task<string?> GetUserNameAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user?.UserName;
    }

    public async Task<bool> IsInRoleAsync(string userId, string role)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is not null && await userManager.IsInRoleAsync(user, role);
    }
}