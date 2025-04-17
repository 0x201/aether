using AutoMapper;

using ModernCSharp.Domain.Entities;
using ModernCSharp.Domain.Enums;

namespace ModernCSharp.ApplicationCore.Ordering.Queries;

public class OrderDto
{
    public OrderStatus OrderStatus
    {
        get;
        set;
    }

    public int Quantity
    {
        get;
        set;
    }
    public decimal Total
    {
        get;
        set;
    }
    public required string CustomerName
    {
        get;
        set;
    }
    public DateTime OrderDate
    {
        get;
        set;
    }

    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<Order, OrderDto>();
        }
    }
}
