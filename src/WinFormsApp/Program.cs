using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using ModernCSharp.Ordering.Application;
using ModernCSharp.Ordering.Application.Queries;
using ModernCSharp.Ordering.Application.Services;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.Ordering.Infrastructure;
using ModernCSharp.Ordering.Infrastructure.Interceptors;
using ModernCSharp.Ordering.Infrastructure.Repositories;
using ModernCSharp.WinFormsApp.Presenters;
using ModernCSharp.Shared;

using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.WinFormsApp;

internal static class Program
{
    /// <summary>
    ///  The main entry point for the application.
    /// </summary>
    [STAThread]
    public static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        var builder = Host.CreateApplicationBuilder(args);

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        builder.Services.AddDbContext<OrderingDbContext>((sp, options) =>
        {
            var connectionString = builder.Configuration.GetConnectionString("orderingdb");

            options
                .UseSqlServer(connectionString)
                .AddInterceptors(sp.GetRequiredService<ISaveChangesInterceptor>());
        });


        builder.Services.AddFileProcessor<Order>()
            .AddFileImportStrategy<OrderCsvImportStrategy, Order>()
            .AddFileImportStrategy<OrderExcelImportStrategy, Order>()
            .AddFileImportStrategy<OrderJsonImportStrategy, Order>()
            .AddFileExportStrategy<OrderCsvExportStrategy, Order>()
            .AddFileExportStrategy<OrderExcelExportStrategy, Order>()
            .AddFileExportStrategy<OrderJsonExportStrategy, Order>();

        builder.AddApplicationServices();

        builder.Services.AddScoped<IOrderRepository, OrderRepository>();
        builder.Services.AddScoped<IOrderQueries, OrderQueries>();

        builder.Services.AddForms();

        var host = builder.Build();
        try
        {
            var mainPresenter = host.Services.GetRequiredService<MainPresenter>();
            mainPresenter.InitializeAsync().GetAwaiter().GetResult();
            Application.Run((Form)mainPresenter.View);
        }
        catch (Exception)
        {

            throw;
        }
    }
}
