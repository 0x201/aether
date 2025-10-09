namespace ModernCSharp.Ordering.Application.Queries;

public interface IOrderQueries
{
    Task<OrderDto> GetOrderAsync(int id);
    Task<IEnumerable<OrderDto>> GetOrdersFromUserAsync(string userId);
    Task<IEnumerable<OrderDto>> GetOrdersAsync();
}
