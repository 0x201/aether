using System.ComponentModel.DataAnnotations;

using ModernCSharp.DDD.Common;

namespace ModernCSharp.Inventory.Domain.Aggregates.ProductAggregate;

public class Product : BaseAuditableEntity<int>, IAggregateRoot
{
    [Required]
    public string ProductName
    {
        get;
        private set;
    }

    public string PictureUrl
    {
        get;
        private set;
    }

    private readonly List<Sku> _skus;

    public IReadOnlyCollection<Sku> OrderItems => _skus.AsReadOnly();

    protected Product()
    {
        _skus = [];
    }
}
