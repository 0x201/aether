using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

using ModernCSharp.ApplicationCore.Common.Interfaces;
using ModernCSharp.Domain.Common;

namespace ModernCSharp.Infrastructure.Data.Interceptors;

public class AuditableEntityInterceptor(
    IUser user,
    TimeProvider dateTime) : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    private void UpdateEntities(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        foreach (var entry in context.ChangeTracker.Entries<IAuditable>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified || entry.HasChangedOwnedEntities())
            {
                var utcNow = dateTime.GetUtcNow();
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedBy = user.Id;
                    entry.Entity.Created = utcNow;
                }
                entry.Entity.LastModifiedBy = user.Id;
                entry.Entity.LastModified = utcNow;
            }
        }
    }
}


public static class Extensions
{
    public static bool HasChangedOwnedEntities(this EntityEntry entry) =>
            entry.References.Any(r =>
            r.TargetEntry is not null &&
            r.TargetEntry.Metadata.IsOwned() &&
            (r.TargetEntry.State == EntityState.Added || r.TargetEntry.State == EntityState.Modified));
}