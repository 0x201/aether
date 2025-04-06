using Microsoft.Extensions.DependencyInjection;

using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Presenters;
using ModernCSharp.WinFormsApp.Views;

namespace ModernCSharp.WinFormsApp;

public static class DependencyInjection
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
}
