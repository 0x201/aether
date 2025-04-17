using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using ModernCSharp.Domain.Constants;
using ModernCSharp.Domain.Entities;
using ModernCSharp.Infrastructure.Identity;

namespace ModernCSharp.Infrastructure.Data;

public static class InitializerExtensions
{
    public static void AddAsyncSeeding(this DbContextOptionsBuilder builder, IServiceProvider serviceProvider)
    {
        builder.UseAsyncSeeding(async (context, _, ct) =>
        {
            var initializer = serviceProvider.GetRequiredService<ApplicationDbContextInitializer>();

            await initializer.SeedAsync();
        });
    }

    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var initializer = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitializer>();

        await initializer.InitializeAsync();
    }
}

public class ApplicationDbContextInitializer(ILogger<ApplicationDbContextInitializer> logger, ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
{
    public async Task InitializeAsync()
    {
        try
        {
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing the database.");
            throw;
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    public async Task TrySeedAsync()
    {
        // Default roles
        var administratorRole = new IdentityRole(Roles.Administrator);

        if (roleManager.Roles.All(r => r.Name != administratorRole.Name))
        {
            await roleManager.CreateAsync(administratorRole);
        }

        // Default users
        var administrator = new ApplicationUser { UserName = "administrator@localhost", Email = "administrator@localhost" };

        if (userManager.Users.All(u => u.UserName != administrator.UserName))
        {
            await userManager.CreateAsync(administrator, "Administrator1!");
            if (!string.IsNullOrWhiteSpace(administratorRole.Name))
            {
                await userManager.AddToRolesAsync(administrator, new[] { administratorRole.Name });
            }
        }

        // Default data
        // Seed, if necessary
        if (!context.Orders.Any())
        {
            List<Order> orders = [
                new Order
                {
                    OrderDate = new DateTime(),
                    OrderStatus = Domain.Enums.OrderStatus.Pending,
                    Total = 1000m,
                    Quantity = 10,
                    CustomerName = "Jack",
                },
                new Order
                {
                    OrderDate = new DateTime(),
                    OrderStatus = Domain.Enums.OrderStatus.Shipped,
                    Total = 1000m,
                    Quantity = 10,
                    CustomerName = "Mary",
                },
                new Order
                {
                    OrderDate = new DateTime(),
                    OrderStatus = Domain.Enums.OrderStatus.Delivered,
                    Total = 1000m,
                    Quantity = 10,
                    CustomerName = "Jack",
                }];
            context.Orders.AddRange(orders);

            await context.SaveChangesAsync();
        }
    }
}
