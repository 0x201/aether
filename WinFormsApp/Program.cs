using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using ModernCSharp.Ordering.Application.Queries;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.Ordering.Infrastructure;
using ModernCSharp.Ordering.Infrastructure.Repositories;
using ModernCSharp.WinFormsApp.Presenters;

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

        var host = CreateHostBuilder(args).Build();
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

    static IHostBuilder CreateHostBuilder(string[] args)
    {
        return Host.CreateDefaultBuilder(args)
            .ConfigureServices((context, services) =>
            {
                services.AddScoped<IOrderRepository, OrderRepository>();
                services.AddScoped<IOrderQueries, OrderQueries>();
                services.AddFileContexts();
                services.AddFileExporters();
                services.AddFileImporters();

                services.AddForms();
            });
    }
}
