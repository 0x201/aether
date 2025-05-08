
using Microsoft.EntityFrameworkCore;

using ModernCSharp.ApplicationCore.Common.Interfaces;

namespace ModernCSharp.ApiService.Application.Queries;

public class OrderQueries(IApplicationDbContext context) : IOrderQueries
{
    public async Task<Order> GetOrderAsync(int id)
    {
        var order = await context.Orders
            .FirstOrDefaultAsync(o => o.Id == id);

        return order is null
            ? throw new KeyNotFoundException()
            : new Order
        {
            ordernumber = order.Id,
            date = order.OrderDate,
            total = order.Total,
            quantity = order.Quantity,
            status = order.OrderStatus.ToString(),
        };
    }
}
