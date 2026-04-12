namespace Aether.DDD.Common;

public abstract class BaseAuditableEntity<TKey> : Entity<TKey>, IAuditable
{
    public DateTimeOffset CreatedAt
    {
        get; set;
    }

    public string CreatedBy
    {
        get; set;
    }

    public DateTimeOffset LastModifiedAt
    {
        get; set;
    }

    public string LastModifiedBy
    {
        get; set;
    }
}
