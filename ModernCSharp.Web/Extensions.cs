using ModernCSharp.EventBus.Abstractions;

namespace ModernCSharp.Web;

public static class Extensions
{
    public static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;

        builder.AddRabbitMqEventBus("eventbus")
            .AddEventBusSubscriptions();

    }

    public static void AddEventBusSubscriptions(this IEventBusBuilder eventBus)
    {

    }
}
