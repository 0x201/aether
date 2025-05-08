using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.ApplicationCore.Services;

public class OrderService : IOrderService
{
    private List<Order> Orders
    {
        get;
    } =
    [
        new("12345", 
            "Jack", 
            new Address("", "", "", "", ""), 
            1, 
            "123", 
            "1234", 
            "12345", 
            new DateTime(2025,12,31)),
        new("12345", 
            "Jack", 
            new Address("", "", "", "", ""), 
            1, 
            "123", 
            "1234", 
            "12345", 
            new DateTime(2025,12,31)),
        new("12345", 
            "Jack", 
            new Address("", "", "", "", ""), 
            1, 
            "123", 
            "1234", 
            "12345", 
            new DateTime(2025,12,31)),
        new("12345", 
            "Jack", 
            new Address("", "", "", "", ""), 
            1, 
            "123", 
            "1234", 
            "12345", 
            new DateTime(2025,12,31)),
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