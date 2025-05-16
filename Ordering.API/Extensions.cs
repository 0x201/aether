using ModernCSharp.Ordering.API.Infrastructure;
using ModernCSharp.Ordering.Application.Common.Interfaces;
using ModernCSharp.Ordering.Application.Queries;

namespace ModernCSharp.Ordering.API;

internal static class Extensions
{
    public static void AddApplicationService(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;

        var connectionString = builder.Configuration.GetConnectionString("orderingdb");

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        services.AddDbContext<OrderingDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseSqlServer(connectionString);
        });

        builder.EnrichSqlServerDbContext<OrderingDbContext>();

        services.AddMigration<OrderingDbContext, OrderingDbContextSeed>();

        builder.AddRabbitMqEventBus("eventbus")
            .AddEventBusSubscriptions();

        services.AddHttpContextAccessor();
        builder.Services.AddTransient<IIdentityService, IdentityService>();

        services.AddScoped<IOrderRepository, OrderRepository>();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblyContaining(typeof(Program));

            //cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
        });

        services.AddScoped<IOrderQueries, OrderQueries>();
        services.AddScoped<IRequestManager, RequestManager>();
    }

    private static void AddEventBusSubscriptions(this IEventBusBuilder eventBus)
    {
        //eventBus.AddSubscription<GracePeriodConfirmedIntegrationEvent, GracePeriodConfirmedIntegrationEventHandler>();
        //eventBus.AddSubscription<OrderStockConfirmedIntegrationEvent, OrderStockConfirmedIntegrationEventHandler>();
        //eventBus.AddSubscription<OrderStockRejectedIntegrationEvent, OrderStockRejectedIntegrationEventHandler>();
        //eventBus.AddSubscription<OrderPaymentFailedIntegrationEvent, OrderPaymentFailedIntegrationEventHandler>();
        //eventBus.AddSubscription<OrderPaymentSucceededIntegrationEvent, OrderPaymentSucceededIntegrationEventHandler>();
    }
}
