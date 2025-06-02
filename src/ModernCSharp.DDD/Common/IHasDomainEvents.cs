using MediatR;

namespace ModernCSharp.DDD.Common;

public interface IHasDomainEvents
{
    IReadOnlyCollection<INotification> DomainEvents
    {
        get;
    }

    void ClearDomainEvents();
}
