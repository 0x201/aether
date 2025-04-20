using Microsoft.Extensions.DependencyInjection;

namespace ModernCSharp.EventBus.Abstractions;

public interface IEventBusBuilder
{
    public IServiceCollection Services
    {
        get;
    }
}