
namespace Aether.Ordering.Infrastructure.Repositories;

public class OrderRepository(OrderingDbContext context) : IOrderRepository
{
    private readonly OrderingDbContext _context = context ?? throw new ArgumentNullException(nameof(context));

    public IUnitOfWork UnitOfWork => _context;

    public Order Add(Order order)
    {
        return _context.Orders.Add(order).Entity;
    }

    public async Task<Order> GetAsync(int orderId)
    {
        var order = await _context.Orders.FindAsync(orderId);

        //if (order is not null)
        //{

        //}

        return order;
    }

    public void Update(Order order)
    {
        _context.Entry(order).State = EntityState.Modified;
    }

    public async Task<IEnumerable<Order>> GetOrdersAsync()
    {
        return await _context.Orders.AsNoTracking().ToListAsync();
    }
}
