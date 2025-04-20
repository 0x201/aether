using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.Domain.Entities;
using ModernCSharp.Domain.Enums;

namespace ModernCSharp.ApplicationCore.Services;

public class OrderService : IOrderService
{
    private List<Order> Orders
    {
        get;
    } =
    [
        new() { Id = 1, OrderStatus = OrderStatus.Pending, Quantity = 10, Total = 100, OrderDate = new DateTime(2025, 4, 7), CustomerName = "Jack" },
        new() { Id = 2, OrderStatus = OrderStatus.Processing, Quantity = 10, Total = 100, OrderDate = new DateTime(2025, 4, 7), CustomerName = "Lisa" },
        new() { Id = 3, OrderStatus = OrderStatus.Pending, Quantity = 10, Total = 100, OrderDate = new DateTime(2025, 4, 8), CustomerName = "Jack" },
        new() { Id = 4, OrderStatus = OrderStatus.Shipped, Quantity = 10, Total = 100, OrderDate = new DateTime(2025, 4, 7), CustomerName = "Mary" },
        new() { Id = 5, OrderStatus = OrderStatus.Delivered, Quantity = 10, Total = 100, OrderDate = new DateTime(2025, 4, 9), CustomerName = "Jack" },
    ];

    public async Task<List<Order>> GetOrdersAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await Task.FromResult(Orders);
    }

    public Task InsertAsync(Order order)
    {
        Orders.Add(order);
        return Task.CompletedTask;
    }

    public Task InsertManyAsync(List<Order> orders)
    {
        Orders.AddRange(orders);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(int id)
    {
        var orderToDelete = Orders.Find(x => x.Id == id) ?? throw new Exception("Order not found");
        Orders.Remove(orderToDelete);
        return Task.CompletedTask;
    }
}