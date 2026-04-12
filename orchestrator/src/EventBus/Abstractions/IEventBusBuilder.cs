using Microsoft.Extensions.DependencyInjection;

namespace Aether.EventBus.Abstractions;

public interface IEventBusBuilder
{
    public IServiceCollection Services
    {
        get;
    }
}