namespace ModernCSharp.ApiService.Application.Queries;

public interface IOrderQueries
{
    Task<Order> GetOrderAsync(int id);

}
