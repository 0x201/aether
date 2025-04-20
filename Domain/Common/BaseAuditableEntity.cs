namespace ModernCSharp.Domain.Common;

public abstract class BaseAuditableEntity<TKey> : BaseEntity<TKey>, IAuditable
{
    public DateTimeOffset Created
    {
        get; set;
    }

    public string? CreatedBy
    {
        get; set;
    }

    public DateTimeOffset LastModified
    {
        get; set;
    }

    public string? LastModifiedBy
    {
        get; set;
    }
}
