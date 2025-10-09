using Microsoft.AspNetCore.Http.HttpResults;

public static class OrderApi
{
    public static RouteGroupBuilder MapOrdersApiV1(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/orders").HasApiVersion(1.0);

        api.MapGet("/", GetOrdersByUserAsync);

        return api;
    }

    public static async Task<Ok<IEnumerable<OrderDto>>> GetOrdersByUserAsync([AsParameters] OrderService services)
    {
        var userId = services.IdentityService.GetUserIdentity();
        var orders = await services.Queries.GetOrdersFromUserAsync(userId);
        return TypedResults.Ok(orders);
    }
}
