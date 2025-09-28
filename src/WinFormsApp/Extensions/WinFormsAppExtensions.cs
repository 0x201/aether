using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.Ordering.Infrastructure;
using ModernCSharp.Ordering.Infrastructure.Interceptors;
using ModernCSharp.Ordering.Application;

using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.WinFormsApp.Extensions;

public static class Extensions
{
    public static IServiceCollection AddForms(this IServiceCollection services)
    {
        services.AddSingleton<IMainView, MainForm>();
        services.AddTransient<IImportView, ImportOrdersView>();
        services.AddTransient<IOrderListView, OrderListView>();

        services.AddTransient<MainPresenter>();
        services.AddTransient<IPresenter<IMainView>>(sp =>
        {
            var presenter = sp.GetRequiredService<MainPresenter>();
            return presenter;
        });

        services.AddTransient<ImportOrderPresenter>();
        services.AddTransient<IPresenter<IImportView>>(sp =>
        {
            var presenter = sp.GetRequiredService<ImportOrderPresenter>();
            return presenter;
        });

        services.AddSingleton<OrdersListPresenter>();
        services.AddSingleton<IPresenter<IOrderListView>>(sp =>
        {
            var presenter = sp.GetRequiredService<OrdersListPresenter>();
            return presenter;
        });

        return services;
    }

    public static void AddApplicationServices(this IHostApplicationBuilder builder)
    {
        builder.AddOrderingApplicationServices();
        var services = builder.Services;

        builder.Services
            .AddFileProcessor<Order>()
            .AddFileImportStrategy<OrderCsvImportStrategy, Order>()
            .AddFileImportStrategy<OrderExcelImportStrategy, Order>()
            .AddFileImportStrategy<OrderJsonImportStrategy, Order>()
            .AddFileExportStrategy<OrderCsvExportStrategy, Order>()
            .AddFileExportStrategy<OrderExcelExportStrategy, Order>()
            .AddFileExportStrategy<OrderJsonExportStrategy, Order>();

        var connectionString = builder.Configuration.GetConnectionString("orderingdb");
        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        services.AddDbContext<OrderingDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString)
                .AddInterceptors(sp.GetRequiredService<ISaveChangesInterceptor>());
        });

        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderQueries, OrderQueries>();

        services.AddHttpClients();
        services.AddForms();
    }

    public static IServiceCollection AddHttpClients(this IServiceCollection services)
    {
        services.AddHttpClient<OrderingApiClient>(client => client.BaseAddress = new("https+http://orderingapi"));
        return services;
    }
}
