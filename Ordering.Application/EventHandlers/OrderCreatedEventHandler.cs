using Microsoft.Extensions.Logging;

using ModernCSharp.Ordering.Domain.Events;

namespace ModernCSharp.Ordering.Application.EventHandlers;
public class OrderCreatedEventHandler(ILogger<OrderCreatedEventHandler> logger) : INotificationHandler<OrderCreatedEvent>
{
    public Task Handle(OrderCreatedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("MC Domain Event: {DomainEvent}", notification.GetType().Name);

        return Task.CompletedTask;
    }
}
