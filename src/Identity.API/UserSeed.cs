
using Microsoft.AspNetCore.Identity;

namespace ModernCSharp.Identity.API;

public class UserSeed(
    ILogger<UserSeed> logger,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager) : IDbSeeder<ApplicationDbContext>
{
    public async Task SeedAsync(ApplicationDbContext context)
    {
        var adminRoleExist = await roleManager.RoleExistsAsync("Admin");

        if (!adminRoleExist)
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }

        var alice = await userManager.FindByNameAsync("alice");

        if (alice == null)
        {
            alice = new ApplicationUser
            {
                UserName = "alice",
                Email = "AliceSmith@email.com",
                EmailConfirmed = true,
                Id = Guid.CreateVersion7().ToString(),
            };

            var result = await userManager.CreateAsync(alice, "Pass123$");

            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }

            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("alice created");
            }

        }
        else
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("alice already exists");
            }
        }

        var bob = await userManager.FindByNameAsync("bob");

        if (bob == null)
        {
            bob = new ApplicationUser
            {
                UserName = "bob",
                Email = "BobSmith@email.com",
                EmailConfirmed = true,
                Id = Guid.CreateVersion7().ToString(),
            };

            var result = await userManager.CreateAsync(bob, "Pass123$");

            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }

            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("bob created");
            }

            var addToRoleResult = await userManager.AddToRoleAsync(bob, "Admin");

            if (!addToRoleResult.Succeeded)
            {
                throw new Exception($"Failed to add role: {string.Join(", ", addToRoleResult.Errors)}");
            }
        }
        else
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("bob already exists");
            }
        }
    }
}
