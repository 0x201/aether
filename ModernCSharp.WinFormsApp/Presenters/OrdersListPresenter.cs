using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Services;
using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Views;

namespace ModernCSharp.WinFormsApp.Presenters;

public class OrdersListPresenter(OrderService orderService) : AbstractPresenter<OrderListView, OrdersListPresenter>
{
    public async Task<List<Order>> GetOrders()
    {
        return await orderService.GetOrdersAsync();
    }
}
