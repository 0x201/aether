namespace ModernCSharp.Ordering.Application.Queries;

public class OrderQueries(IOrderRepository orderRepository) : IOrderQueries
{
    public async Task<OrderDto> GetOrderAsync(int id)
    {
        var order = await orderRepository.GetAsync(id);

        return order is null
            ? throw new KeyNotFoundException()
            : new OrderDto
            {
                ordernumber = order.Id,
                date = order.OrderDate,
                total = order.Total,
                quantity = order.Quantity,
                status = order.OrderStatus.ToString(),
            };
    }

    public async Task<IEnumerable<OrderDto>> GetOrdersAsync()
    {
        var orders = await orderRepository.GetOrdersAsync();

        return orders
            .Select(order => new OrderDto
            {
                ordernumber = order.Id,
                date = order.OrderDate,
                total = order.Total,
                quantity = order.Quantity,
                status = order.OrderStatus.ToString(),
            });
    }

    public async Task<IEnumerable<OrderDto>> GetOrdersFromUserAsync(string userId)
    {
        var orders = await orderRepository.GetOrdersAsync();

        return orders
            .Where(order => order.Buyer.IdentityGuid == userId)
            .Select(order => new OrderDto
            {
                ordernumber = order.Id,
                date = order.OrderDate,
                total = order.Total,
                quantity = order.Quantity,
                status = order.OrderStatus.ToString(),
            });
    }
}
