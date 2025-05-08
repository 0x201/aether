using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.ApplicationCore.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Order> Orders
    {
        get;
    }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
