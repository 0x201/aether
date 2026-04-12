using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Aether.Ordering.Domain.Aggregates.OrderAggregate;
using Aether.Ordering.Infrastructure;
using Aether.Ordering.Application;
using Aether.Shared.Interceptors;

namespace Aether.WinFormsApp.Extensions;

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
            .AddFileProcessor<OrderDto>()
            .AddFileImportStrategy<OrderCsvImportStrategy, OrderDto>()
            .AddFileImportStrategy<OrderExcelImportStrategy, OrderDto>()
            .AddFileImportStrategy<OrderJsonImportStrategy, OrderDto>()
            .AddFileExportStrategy<OrderCsvExportStrategy, OrderDto>()
            .AddFileExportStrategy<OrderExcelExportStrategy, OrderDto>()
            .AddFileExportStrategy<OrderJsonExportStrategy, OrderDto>();

        var connectionString = builder.Configuration.GetConnectionString("orderingdb");
        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        services.AddDbContext<OrderingDbContext>((sp, options) =>
        {
            options.UseNpgsql(connectionString)
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
