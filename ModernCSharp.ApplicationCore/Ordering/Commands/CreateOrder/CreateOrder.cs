using MediatR;

using ModernCSharp.ApplicationCore.Common.Interfaces;
using ModernCSharp.Domain.Entities;
using ModernCSharp.Domain.Enums;
using ModernCSharp.Domain.Events;

namespace ModernCSharp.ApplicationCore.Ordering.Commands.CreateOrder;

public record CreateOrderCommand : IRequest<int>
{
    public OrderStatus OrderStatus
    {
        get;
        set;
    }
    public decimal Total
    {
        get;
        set;
    }
    public int Quantity
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
}


public class CreateOrderCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<CreateOrderCommand, int>
{
    public async Task<int> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var entity = new Order
        {
            OrderStatus = request.OrderStatus,
            OrderDate = request.OrderDate,
            CustomerName = request.CustomerName,
            Quantity = request.Quantity,
            Total = request.Total,
        };

        entity.AddDomainEvent(new OrderCreatedEvent(entity));

        dbContext.Orders.Add(entity);

        await dbContext.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
