namespace Aether.EventBus.Events;

public record IntegrationEvent
{
    [JsonInclude]
    public Guid Id
    {
        get;
        set;
    } = Guid.CreateVersion7();

    [JsonInclude]
    public DateTime CreationDate
    {
        get;
        set;
    } = DateTime.UtcNow;
}
