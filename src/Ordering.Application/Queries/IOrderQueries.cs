namespace ModernCSharp.Ordering.Application.Queries;

public interface IOrderQueries
{
    Task<Order> GetOrderAsync(int id);
    Task<IEnumerable<Order>> GetOrdersFromUserAsync(string userId);
    Task<IEnumerable<Order>> GetOrdersAsync();
}
