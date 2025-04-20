using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using ModernCSharp.ApplicationCore.Services;
using ModernCSharp.Infrastructure;
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
                services.AddScoped<OrderService>();
                services.AddFileContexts();
                services.AddFileExporters();
                services.AddFileImporters();

                services.AddForms();
            });
    }
}