using Microsoft.EntityFrameworkCore;

using ModernCSharp.Domain.Entities;

namespace ModernCSharp.ApplicationCore.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Order> Orders
    {
        get;
    }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
