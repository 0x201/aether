using Microsoft.Extensions.Logging;
using ModernCSharp.Ordering.Application.IntegrationEvents;
using ModernCSharp.Ordering.Application.IntegrationEvents.Events;

namespace ModernCSharp.Ordering.Application.Commands;

public class CreateOrderCommandHandler(
    IOrderingIntegrationEventService orderingIntegrationEventService,
    IOrderRepository orderRepository,
    ILogger<CreateOrderCommandHandler> logger) : IRequestHandler<CreateOrderCommand, bool>
{
    public async Task<bool> Handle(CreateOrderCommand message, CancellationToken cancellationToken)
    {
        var orderStartedIntegrationEvent = new OrderStartedIntegrationEvent(message.CustomerName);
        await orderingIntegrationEventService.AddAndSaveEventAsync(orderStartedIntegrationEvent);


        var address = new Address("", "", "", "", "");
        var order = new Order(userId: "123",
            userName: message.CustomerName,
            address: address,
            cardTypeId: 1,
            cardNumber: "",
            cardSecurityNumber: "",
            cardHolderName: "",
            cardExpiration: DateTime.Now);

        logger.LogInformation("Creating Order - Order: {@Order}", order);

        orderRepository.Add(order);

        return await orderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
    }
}
