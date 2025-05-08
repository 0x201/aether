using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

using ModernCSharp.ApiService.Application.Queries;
using ModernCSharp.ApplicationCore.Abstractions;

namespace ModernCSharp.ApiService.Apis;

public static class OrderApi
{
    public static RouteGroupBuilder MapOrdersApi(this RouteGroupBuilder app)
    {
        //app.MapGet("orders", GetOrderAsync);

        return app;
    }

    //public static async Task<Results<Ok<Order>, NotFound>> GetOrderAsync(int orderId, [FromServices] IOrderService orderService)
    //{

    //    return await orderService.GetOrdersAsync();
    //}
}
