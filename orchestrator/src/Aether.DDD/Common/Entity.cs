using System.ComponentModel.DataAnnotations.Schema;

using MediatR;

namespace Aether.DDD.Common;

public interface IHasId<TKey>
{
    TKey Id { get; set; }
}

public abstract class Entity<TKey> : IHasDomainEvents, IHasId<TKey>
{
    public TKey Id
    {
        get;
        set;
    }

    private List<INotification> _domainEvents;

    [NotMapped]
    public IReadOnlyCollection<INotification> DomainEvents => _domainEvents.AsReadOnly();


    public void AddDomainEvent(INotification domainEvent)
    {
        _domainEvents ??= [];
        _domainEvents.Add(domainEvent);
    }

    public void RemoveDomainEvent(INotification domainEvent)
    {
        _domainEvents?.Remove(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
