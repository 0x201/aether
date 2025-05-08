using System.Collections.ObjectModel;

using CommunityToolkit.Mvvm.ComponentModel;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
using ModernCSharp.WPFApp.Contracts.ViewModels;

namespace ModernCSharp.WPFApp.ViewModels;

public partial class OrderViewModel : ObservableObject, INavigationAware
{
    private readonly IOrderService _orderService;

    [ObservableProperty]
    public ObservableCollection<Order> _orders = [];
    public OrderViewModel()
    {
        _orderService = App.GetService<IOrderService>();
    }

    public void OnNavigatedFrom() => throw new NotImplementedException();
    public async void OnNavigatedTo(object parameter)
    {
        var orders = await _orderService.GetOrdersAsync();

        foreach (var order in orders)
        {
            Orders.Add(order);
        }
    }
}
