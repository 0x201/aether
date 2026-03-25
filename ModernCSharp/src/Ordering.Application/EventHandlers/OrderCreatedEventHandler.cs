namespace ModernCSharp.Ordering.Application.EventHandlers;
public class OrderCreatedEventHandler(ILogger<OrderCreatedEventHandler> logger) : INotificationHandler<OrderCreatedEvent>
{
    public Task Handle(OrderCreatedEvent notification, CancellationToken cancellationToken)
    {
        logger.ZLogInformation($"MC Domain Event: {notification.GetType().Name}");

        return Task.CompletedTask;
    }
}
