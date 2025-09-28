namespace ModernCSharp.WinFormsApp;

public static class AppHost
{
    [STAThread]
    static void Main()
    {
        var builder = Host.CreateApplicationBuilder();

        builder.AddAppDefaults();

        builder.AddApplicationServices();

        var app = builder.Build();
        Services = app.Services;
        app.Start();

        ApplicationConfiguration.Initialize();
        var mainPresenter = Services.GetRequiredService<MainPresenter>();
        mainPresenter.InitializeAsync().GetAwaiter().GetResult();
        //Application.Run(ActivatorUtilities.CreateInstance<MainForm>(app.Services));
        Application.Run((Form)mainPresenter.View);
        app.StopAsync().GetAwaiter().GetResult();
    }

    public static IServiceProvider Services { get; private set; } = default!;
}
