using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Services;
using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Views;

namespace ModernCSharp.WinFormsApp.Presenters;

public class OrdersListPresenter : AbstractPresenter<OrderListView, OrdersListPresenter>
{
    private readonly OrderService _orderService;

    public OrdersListPresenter(OrderService orderService)
    {
        _orderService = orderService;
    }

    public async Task<List<Order>> GetOrders()
    {
        return await _orderService.GetOrdersAsync();
    }
}
