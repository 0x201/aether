using ModernCSharp.Ordering.Application;
using ModernCSharp.Ordering.Infrastructure.Interceptors;

using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.WinUIApp;

public partial class App : Microsoft.UI.Xaml.Application
{
    public IHost Host
    {
        get;
    }

    public static T GetService<T>()
        where T : class
    {
        if ((App.Current as App)!.Host.Services.GetService(typeof(T)) is not T service)
        {
            throw new ArgumentException($"{typeof(T)} needs to be registered in ConfigureServices within App.xaml.cs.");
        }

        return service;
    }

    public static WindowEx MainWindow { get; } = new MainWindow();

    public static UIElement? AppTitlebar { get; set; }

    public App()
    {
        InitializeComponent();
        var builder = Microsoft.Extensions.Hosting.Host
            .CreateApplicationBuilder();

        builder.AddApplicationServices();

        ConfigureServices(builder);

        Host = builder.Build();
        UnhandledException += App_UnhandledException;
    }


    static void ConfigureServices(HostApplicationBuilder builder)
    {
        // Default Activation Handler
        builder.Services.AddTransient<ActivationHandler<LaunchActivatedEventArgs>, DefaultActivationHandler>();

        // Other Activation Handlers

        // Services
        builder.Services.AddSingleton<ILocalSettingsService, LocalSettingsService>();
        builder.Services.AddSingleton<IThemeSelectorService, ThemeSelectorService>();
        builder.Services.AddTransient<INavigationViewService, NavigationViewService>();

        builder.Services.AddSingleton<IActivationService, ActivationService>();
        builder.Services.AddSingleton<IPageService, PageService>();
        builder.Services.AddSingleton<INavigationService, NavigationService>();

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        builder.Services.AddDbContext<OrderingDbContext>((sp, options) =>
        {
            var connectionString = builder.Configuration.GetConnectionString("orderingdb");

            options
                .UseSqlServer(connectionString)
                .AddInterceptors(sp.GetRequiredService<ISaveChangesInterceptor>());
        });

        // Core Services
        builder.Services.AddSingleton<IFileService, FileService>();
        builder.Services.AddTransient<IOrderQueries, OrderQueries>();
        builder.Services.AddScoped<IOrderRepository, OrderRepository>();

        builder.Services.AddFileProcessor<Order>()
            .AddFileImportStrategy<OrderCsvImportStrategy, Order>()
            .AddFileImportStrategy<OrderExcelImportStrategy, Order>()
            .AddFileImportStrategy<OrderJsonImportStrategy, Order>()
            .AddFileExportStrategy<OrderCsvExportStrategy, Order>()
            .AddFileExportStrategy<OrderExcelExportStrategy, Order>()
            .AddFileExportStrategy<OrderJsonExportStrategy, Order>();


        // UserControls
        builder.Services.AddTransient<AddOrderDialog>();

        // Views and ViewModels
        builder.Services.AddTransient<SettingsViewModel>();
        builder.Services.AddTransient<SettingsPage>();
        builder.Services.AddTransient<OrdersViewModel>();
        builder.Services.AddTransient<OrdersPage>();
        builder.Services.AddTransient<MainViewModel>();
        builder.Services.AddTransient<MainPage>();
        builder.Services.AddTransient<ShellPage>();
        builder.Services.AddTransient<ShellViewModel>();

        builder.Services.AddTransient<ImportOrdersViewModel>();

        // Configuration
        builder.Services.Configure<LocalSettingsOptions>(builder.Configuration.GetSection(nameof(LocalSettingsOptions)));
    }

    private void App_UnhandledException(object sender, Microsoft.UI.Xaml.UnhandledExceptionEventArgs e)
    {
        // TODO: Log and handle exceptions as appropriate.
        // https://docs.microsoft.com/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.application.unhandledexception.
    }

    protected async override void OnLaunched(LaunchActivatedEventArgs args)
    {
        base.OnLaunched(args);

        await App.GetService<IActivationService>().ActivateAsync(args);
    }
}
