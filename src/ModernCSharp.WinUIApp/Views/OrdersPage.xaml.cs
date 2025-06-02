using Microsoft.UI.Xaml.Controls;

using ModernCSharp.Ordering.Application.Queries;
using ModernCSharp.WinUIApp.ViewModels;

namespace ModernCSharp.WinUIApp.Views;

public sealed partial class OrdersPage : Page
{
    public OrdersViewModel ViewModel
    {
        get;
    }

    public OrdersPage()
    {
        ViewModel = App.GetService<OrdersViewModel>();
        InitializeComponent();
    }

    private void OrderListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        var selectedOrder = (Order)OrderListView.SelectedItem;
        ViewModel.SelectedOrder = selectedOrder;
    }
}
