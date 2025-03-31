using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using ModernCSharp.ApplicationCore;
using ModernCSharp.ApplicationCore.Services;
using ModernCSharp.WinFormsApp.Views;

namespace ModernCSharp.WinFormsApp;

internal static class Program
{
    /// <summary>
    ///  The main entry point for the application.
    /// </summary>
    [STAThread]
    static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        var host = CreateHostBuilder(args).Build();
        var mainForm = host.Services.GetRequiredService<MainForm>();
        System.Windows.Forms.Application.Run(mainForm);
    }

    static IHostBuilder CreateHostBuilder(string[] args)
    {
        return Host.CreateDefaultBuilder(args)
            .ConfigureServices((context, services) =>
            {
                services.AddScoped<OrderService>();

                services.AddFileExporters();
                services.AddFileImporters();

                services.AddForms();
            });
    }
}