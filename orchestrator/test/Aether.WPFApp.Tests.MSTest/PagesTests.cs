using System.Reflection;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using Aether.WPFApp.Contracts.Services;
using Aether.WPFApp.Core.Contracts.Services;
using Aether.WPFApp.Core.Services;
using Aether.WPFApp.Models;
using Aether.WPFApp.Services;
using Aether.WPFApp.ViewModels;
using Aether.WPFApp.Views;

namespace Aether.WPFApp.Tests.MSTest;

[TestClass]
public class PagesTests
{
    private readonly IHost _host;

    public PagesTests()
    {
        var appLocation = Path.GetDirectoryName(Assembly.GetEntryAssembly()?.Location);
        _host = Host.CreateDefaultBuilder()
            .ConfigureAppConfiguration(c => c.SetBasePath(appLocation))
            .ConfigureServices(ConfigureServices)
            .Build();
    }

    private void ConfigureServices(HostBuilderContext context, IServiceCollection services)
    {
        // Core Services
        services.AddSingleton<IFileService, FileService>();

        // Services
        services.AddSingleton<IThemeSelectorService, ThemeSelectorService>();
        services.AddSingleton<ISystemService, SystemService>();
        services.AddSingleton<ISampleDataService, SampleDataService>();
        services.AddSingleton<IPersistAndRestoreService, PersistAndRestoreService>();
        services.AddSingleton<IApplicationInfoService, ApplicationInfoService>();
        services.AddSingleton<IPageService, PageService>();
        services.AddSingleton<INavigationService, NavigationService>();

        // ViewModels
        services.AddTransient<SettingsViewModel>();
        services.AddTransient<OrderListDetailsViewModel>();
        services.AddTransient<OrderDataGridViewModel>();
        services.AddTransient<MainViewModel>();
        services.AddTransient<OrderViewModel>();

        // Configuration
        services.Configure<AppConfig>(context.Configuration.GetSection(nameof(AppConfig)));
    }

    // TODO: Add tests for functionality you add to SettingsViewModel.
    [TestMethod]
    public void TestSettingsViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(SettingsViewModel));
        Assert.IsNotNull(vm);
    }

    [TestMethod]
    public void TestGetSettingsPageType()
    {
        if (_host.Services.GetService(typeof(IPageService)) is IPageService pageService)
        {
            var pageType = pageService.GetPageType(typeof(SettingsViewModel).FullName);
            Assert.AreEqual(typeof(SettingsPage), pageType);
        }
        else
        {
            Assert.Fail($"Can't resolve {nameof(IPageService)}");
        }
    }

    // TODO: Add tests for functionality you add to OrderListDetailsViewModel.
    [TestMethod]
    public void TestOrderListDetailsViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(OrderListDetailsViewModel));
        Assert.IsNotNull(vm);
    }

    [TestMethod]
    public void TestGetOrderListDetailsPageType()
    {
        if (_host.Services.GetService(typeof(IPageService)) is IPageService pageService)
        {
            var pageType = pageService.GetPageType(typeof(OrderListDetailsViewModel).FullName);
            Assert.AreEqual(typeof(OrderListDetailsPage), pageType);
        }
        else
        {
            Assert.Fail($"Can't resolve {nameof(IPageService)}");
        }
    }

    // TODO: Add tests for functionality you add to OrderDataGridViewModel.
    [TestMethod]
    public void TestOrderDataGridViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(OrderDataGridViewModel));
        Assert.IsNotNull(vm);
    }

    [TestMethod]
    public void TestGetOrderDataGridPageType()
    {
        if (_host.Services.GetService(typeof(IPageService)) is IPageService pageService)
        {
            var pageType = pageService.GetPageType(typeof(OrderDataGridViewModel).FullName);
            Assert.AreEqual(typeof(OrderDataGridPage), pageType);
        }
        else
        {
            Assert.Fail($"Can't resolve {nameof(IPageService)}");
        }
    }

    // TODO: Add tests for functionality you add to MainViewModel.
    [TestMethod]
    public void TestMainViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(MainViewModel));
        Assert.IsNotNull(vm);
    }

    [TestMethod]
    public void TestGetMainPageType()
    {
        if (_host.Services.GetService(typeof(IPageService)) is IPageService pageService)
        {
            var pageType = pageService.GetPageType(typeof(MainViewModel).FullName);
            Assert.AreEqual(typeof(MainPage), pageType);
        }
        else
        {
            Assert.Fail($"Can't resolve {nameof(IPageService)}");
        }
    }

    // TODO: Add tests for functionality you add to BlankViewModel.
    [TestMethod]
    public void TestBlankViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(OrderViewModel));
        Assert.IsNotNull(vm);
    }

    [TestMethod]
    public void TestGetBlankPageType()
    {
        if (_host.Services.GetService(typeof(IPageService)) is IPageService pageService)
        {
            var pageType = pageService.GetPageType(typeof(OrderViewModel).FullName);
            Assert.AreEqual(typeof(OrderPage), pageType);
        }
        else
        {
            Assert.Fail($"Can't resolve {nameof(IPageService)}");
        }
    }
}
