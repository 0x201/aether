using System.Reflection;
using System.Text.Json.Serialization;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Common.Interfaces;
using ModernCSharp.ApplicationCore.Services;
using ModernCSharp.Ordering.Infrastructure;
using ModernCSharp.OrderProcessor.Events;
using ModernCSharp.OrderProcessor.Services;

namespace ModernCSharp.OrderProcessor.Extensions;

internal static class Extensions
{
    public static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;
        services.AddTransient<IUser, CurrentUser>();

        builder.AddInfrastructureServices();

        builder.AddRabbitMqEventBus("eventbus")
               .ConfigureJsonOptions(options => options.TypeInfoResolverChain.Add(IntegrationEventContext.Default));

        services.AddOptions<BackgroundTaskOptions>()
            .BindConfiguration(nameof(BackgroundTaskOptions));

        services.AddTransient<IOrderService, OrderService>();

        builder.AddFileProcessServices();

        services.AddHttpContextAccessor();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
        });

        services.AddHostedService<OrderWorker>();
    }
}

[JsonSerializable(typeof(GracePeriodConfirmedIntegrationEvent))]
partial class IntegrationEventContext : JsonSerializerContext
{

}
