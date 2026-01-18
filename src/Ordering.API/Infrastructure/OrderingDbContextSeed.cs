namespace ModernCSharp.Ordering.API.Infrastructure;

public class OrderingDbContextSeed : IDbSeeder<OrderingDbContext>
{
    public async Task SeedAsync(OrderingDbContext context)
    {
        await context.SaveChangesAsync();
    }
}
