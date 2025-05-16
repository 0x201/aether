using System.Reflection;
using System.Text.Json.Serialization;

using Microsoft.EntityFrameworkCore.Diagnostics;

using ModernCSharp.Ordering.Application.Common.Interfaces;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.Ordering.Infrastructure.Interceptors;
using ModernCSharp.Ordering.Infrastructure.Repositories;
using ModernCSharp.Ordering.OrderProcessor.Services;

namespace ModernCSharp.Ordering.OrderProcessor.Extensions;

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
                    .UseSqlServer(connectionString)
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
