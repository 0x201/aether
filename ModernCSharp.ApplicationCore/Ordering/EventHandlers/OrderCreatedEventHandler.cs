using MediatR;

using Microsoft.Extensions.Logging;

using ModernCSharp.Domain.Events;

namespace ModernCSharp.ApplicationCore.Ordering.EventHandlers;
public class OrderCreatedEventHandler(ILogger<OrderCreatedEventHandler> logger) : INotificationHandler<OrderCreatedEvent>
{
    public Task Handle(OrderCreatedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("MC Domain Event: {DomainEvent}", notification.GetType().Name);

        return Task.CompletedTask;
    }
}
