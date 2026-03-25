using System.Linq.Expressions;

namespace ModernCSharp.Shared;

public static class FileStrategyServiceCollectionExtensions
{
    public static IServiceCollection AddFileImportStrategy<TStrategy, T>(this IServiceCollection services)
        where TStrategy : class, IFileImportStrategy<T>
    {
        services.AddSingleton<IFileImportStrategy<T>, TStrategy>();
        return services;
    }

    public static IServiceCollection AddFileExportStrategy<TStrategy, T>(this IServiceCollection services)
        where TStrategy : class, IFileExportStrategy<T>
    {
        services.AddSingleton<IFileExportStrategy<T>, TStrategy>();
        return services;
    }

    public static IServiceCollection AddFileProcessor<T>(this IServiceCollection services)
    {
        services.AddSingleton<IFileExportStrategyFactory<T>, FileExportStrategyFactory<T>>();
        services.AddSingleton<IFileImportStrategyFactory<T>, FileImportStrategyFactory<T>>();
        services.AddScoped<IFileProcessingService<T>, FileProcessingService<T>>();
        return services;
    }
}


public static class CollectionExtensions
{
    public static IQueryable<T> WhereIf<T>(this IQueryable<T> query, bool condition, Expression<Func<T, bool>> predicate)
    => condition ? query.Where(predicate) : query;

    public static IQueryable<T> PagedBy<T>(this IQueryable<T> query, int page, int pageSize)
    {
        if (page < 1)
            page = 1;
        if (pageSize < 1)
            pageSize = 10;

        page -= 1;

        return query.Skip(page * pageSize).Take(pageSize);
    }

    public static IQueryable<T> PagedByKeyset<T>(this IQueryable<T> query, int? lastId, int pageSize, bool sortDirection = false)
      where T : class, IHasId<int>
    {
        if (pageSize < 1)
        {
            pageSize = 10;
        }

        if (lastId.HasValue && lastId.Value > 0)
        {
            if (sortDirection)
            {
                return query.Where(x => x.Id > lastId.Value).Take(pageSize);
            }
            else
            {
                return query.Where(x => x.Id < lastId.Value).Take(pageSize);
            }
        }

        return query.Take(pageSize);
    }
}


public static class ModelBuilderExtensions
{
    public static void ApplyAuditableEntityConfiguration(this ModelBuilder modelBuilder)
    {
        var auditableEntities = modelBuilder.Model.GetEntityTypes()
            .Where(e => typeof(IAuditable).IsAssignableFrom(e.ClrType))
            .ToList();

        foreach (var entityType in auditableEntities)
        {
            var builder = modelBuilder.Entity(entityType.ClrType);

            builder.Property(nameof(IAuditable.CreatedAt))
                .IsRequired()
                .HasColumnName("created_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .ValueGeneratedOnAdd();

            builder.Property(nameof(IAuditable.LastModifiedAt))
                .HasColumnName("last_modified_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .ValueGeneratedOnAddOrUpdate();

            builder.Property(nameof(IAuditable.CreatedBy))
                .IsRequired()
                .HasColumnName("created_by")
                .HasDefaultValue("");

            builder.Property(nameof(IAuditable.LastModifiedBy))
                .HasColumnName("last_modified_by");
        }
    }
}
