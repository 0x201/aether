namespace ModernCSharp.EventBus.Abstractions;

public interface IEventBus
{
    Task PublishAsync(IntegrationEvent @event, CancellationToken cancellationToken = default);
}