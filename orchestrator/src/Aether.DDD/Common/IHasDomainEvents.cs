using MediatR;

namespace Aether.DDD.Common;

public interface IHasDomainEvents
{
    IReadOnlyCollection<INotification> DomainEvents
    {
        get;
    }

    void ClearDomainEvents();
}
