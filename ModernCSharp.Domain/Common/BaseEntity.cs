using System.ComponentModel.DataAnnotations.Schema;

namespace ModernCSharp.Domain.Common;

public abstract class BaseEntity<TKey> : IHasDomainEvents
{
    public TKey Id
    {
        get;
        set;
    }

    private readonly List<BaseEvent> _domainEvents = [];

    [NotMapped]
    public IReadOnlyCollection<BaseEvent> DomainEvents => _domainEvents;


    public void AddDomainEvent(BaseEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void RemoveDomainEvent(BaseEvent domainEvent)
    {
        _domainEvents.Remove(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
