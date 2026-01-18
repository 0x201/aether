using System.Windows;
using System.Windows.Threading;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using ModernCSharp.Ordering.Application;
using ModernCSharp.Ordering.Application.Queries;
using ModernCSharp.Ordering.Application.Services;
using ModernCSharp.Ordering.Infrastructure;
using ModernCSharp.Ordering.Infrastructure.Interceptors;
using ModernCSharp.Shared;
using ModernCSharp.WPFApp.Contracts.Services;
using ModernCSharp.WPFApp.Contracts.Views;
using ModernCSharp.WPFApp.Core.Contracts.Services;
using ModernCSharp.WPFApp.Core.Services;
using ModernCSharp.WPFApp.Models;
using ModernCSharp.WPFApp.Services;
using ModernCSharp.WPFApp.ViewModels;
using ModernCSharp.WPFApp.Views;

namespace ModernCSharp.WPFApp;

public partial class App : System.Windows.Application
{
    private static IHost _host;

    public static T GetService<T>()
        where T : class
        => _host.Services.GetService(typeof(T)) as T;

    public App()
    {
    }

    private async void OnStartup(object sender, StartupEventArgs e)
    {
        var builder = Host.CreateApplicationBuilder(e.Args);

        builder.AddServiceDefaults();

        builder.AddOrderingApplicationServices();

        ConfigureServices(builder);

        _host = builder.Build();

        await _host.StartAsync();
    }

    private void ConfigureServices(HostApplicationBuilder builder)
    {
        // TODO: Register your services, viewmodels and pages here

        // App Host
        builder.Services.AddHostedService<ApplicationHostService>();

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        builder.Services.AddDbContext<OrderingDbContext>((sp, options) =>
        {
            var connectionString = builder.Configuration.GetConnectionString("orderingdb");

            options
                .UseNpgsql(connectionString)
                .AddInterceptors(sp.GetRequiredService<ISaveChangesInterceptor>());
        });




        // Activation Handlers

        // Core Services
        builder.Services.AddSingleton<IFileService, FileService>();

        builder.Services.AddFileProcessor<OrderDto>()
            .AddFileImportStrategy<OrderCsvImportStrategy, OrderDto>()
            .AddFileImportStrategy<OrderExcelImportStrategy, OrderDto>()
            .AddFileImportStrategy<OrderJsonImportStrategy, OrderDto>()
            .AddFileExportStrategy<OrderCsvExportStrategy, OrderDto>()
            .AddFileExportStrategy<OrderExcelExportStrategy, OrderDto>()
            .AddFileExportStrategy<OrderJsonExportStrategy, OrderDto>();

        builder.Services.AddTransient<IOrderQueries, OrderQueries>();

        // Services
        builder.Services.AddSingleton<IApplicationInfoService, ApplicationInfoService>();
        builder.Services.AddSingleton<ISystemService, SystemService>();
        builder.Services.AddSingleton<IPersistAndRestoreService, PersistAndRestoreService>();
        builder.Services.AddSingleton<IThemeSelectorService, ThemeSelectorService>();
        builder.Services.AddSingleton<ISampleDataService, SampleDataService>();
        builder.Services.AddSingleton<IPageService, PageService>();
        builder.Services.AddSingleton<INavigationService, NavigationService>();

        // Views and ViewModels
        builder.Services.AddTransient<IShellWindow, ShellWindow>();
        builder.Services.AddTransient<ShellViewModel>();

        builder.Services.AddTransient<MainViewModel>();
        builder.Services.AddTransient<MainPage>();

        builder.Services.AddTransient<OrderListDetailsViewModel>();
        builder.Services.AddTransient<OrderListDetailsPage>();

        builder.Services.AddTransient<OrderDataGridViewModel>();
        builder.Services.AddTransient<OrderDataGridPage>();

        builder.Services.AddTransient<OrderViewModel>();
        builder.Services.AddTransient<OrderPage>();

        builder.Services.AddTransient<SettingsViewModel>();
        builder.Services.AddTransient<SettingsPage>();

        // Configuration
        builder.Services.Configure<AppConfig>(builder.Configuration.GetSection(nameof(AppConfig)));
    }

    private async void OnExit(object sender, ExitEventArgs e)
    {
        await _host.StopAsync();
        _host.Dispose();
        _host = null;
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        // TODO: Please log and handle the exception as appropriate to your scenario
        // For more info see https://docs.microsoft.com/dotnet/api/system.windows.application.dispatcherunhandledexception?view=netcore-3.0
    }
}
