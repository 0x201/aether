using System.Linq.Expressions;

namespace DyDanmaku.API.Extensions;

public static class Extensions
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
}