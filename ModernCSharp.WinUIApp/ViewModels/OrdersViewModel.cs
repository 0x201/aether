using System.Collections.ObjectModel;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.Domain.Entities;
using ModernCSharp.WinUIApp.Contracts.ViewModels;
using ModernCSharp.WinUIApp.Controls;

namespace ModernCSharp.WinUIApp.ViewModels;

public partial class OrdersViewModel(IOrderService orderService) : ObservableRecipient, INavigationAware
{
    [ObservableProperty]
    private ObservableCollection<Order> _orders = [];

    [ObservableProperty] private Order _selectedOrder;

    [RelayCommand]
    private async Task OpenImportDialogAsync(XamlRoot xamlRoot)
    {
        var dialog = new ImportOrdersDialog();
        var contentDialog = new ContentDialog
        {
            Title = "Import Orders",
            Content = dialog,
            PrimaryButtonText = "Save",
            SecondaryButtonText = "Close",
            DefaultButton = ContentDialogButton.Primary,
            XamlRoot = xamlRoot
        };

        var result = await contentDialog.ShowAsync();

        if (result == ContentDialogResult.Primary)
        {
            if (dialog.ViewModel.Orders.Count > 0)
            {
                foreach (var order in dialog.ViewModel.Orders)
                {
                    Orders.Add(order);
                }
            }
        }
    }


    public void OnNavigatedFrom()
    {

    }

    public async void OnNavigatedTo(object parameter)
    {
        var orders = await orderService.GetOrdersAsync();
        foreach (var order in orders)
        {
            Orders.Add(order);
        }
    }
}
