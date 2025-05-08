using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.ApplicationCore.Abstractions;

public interface IOrderService
{
    Task<List<Order>> GetOrdersAsync(CancellationToken cancellationToken = default);
    Task InsertAsync(Order order);
    Task InsertManyAsync(List<Order> orders);
    Task DeleteAsync(int id);
}
