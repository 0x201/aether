
using Aether.DDD.Common;

namespace Aether.Ordering.Domain.Aggregates.OrderAggregate;

public interface IOrderRepository : IRepository<Order>
{
    Order Add(Order order);

    void Update(Order order);

    Task<Order> GetAsync(int orderId);

    Task<IEnumerable<Order>> GetOrdersAsync();
}
