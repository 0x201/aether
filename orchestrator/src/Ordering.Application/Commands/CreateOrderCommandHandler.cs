using Aether.Ordering.Application.IntegrationEvents;
using Aether.Ordering.Application.IntegrationEvents.Events;

namespace Aether.Ordering.Application.Commands;

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

        logger.ZLogInformation($"Creating Order - Order: {order}");

        orderRepository.Add(order);

        return await orderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
    }
}
