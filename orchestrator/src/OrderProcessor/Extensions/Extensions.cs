using System.Reflection;
using System.Text.Json.Serialization;

using Microsoft.EntityFrameworkCore.Diagnostics;

using Aether.Ordering.Application.Common.Interfaces;
using Aether.Ordering.Domain.Aggregates.OrderAggregate;
using Aether.Shared.Interceptors;
using Aether.Ordering.Infrastructure.Repositories;
using Aether.Ordering.OrderProcessor.Services;

namespace Aether.Ordering.OrderProcessor.Extensions;

internal static class Extensions
{
    public static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;
        services.AddTransient<IUser, CurrentUser>();

        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        services.AddDbContext<OrderingDbContext>((sp, options) =>
            {
                var connectionString = builder.Configuration.GetConnectionString("orderingdb");

                options
                    .UseNpgsql(connectionString)
                    .AddInterceptors(sp.GetRequiredService<ISaveChangesInterceptor>());
            });

        builder.AddRabbitMqEventBus("eventbus")
               .ConfigureJsonOptions(options => options.TypeInfoResolverChain.Add(IntegrationEventContext.Default));

        services.AddOptions<BackgroundTaskOptions>()
            .BindConfiguration(nameof(BackgroundTaskOptions));

        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderQueries, OrderQueries>();

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
