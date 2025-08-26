using System.Collections.ObjectModel;

using CommunityToolkit.Mvvm.ComponentModel;

using ModernCSharp.Ordering.Application.Queries;
using ModernCSharp.WPFApp.Contracts.ViewModels;

using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.WPFApp.ViewModels;

public partial class OrderViewModel : ObservableObject, INavigationAware
{
    private readonly IOrderQueries _orderService = App.GetService<IOrderQueries>();

    [ObservableProperty]
    private ObservableCollection<Order> _orders = [];

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
