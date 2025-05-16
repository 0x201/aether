namespace ModernCSharp.Ordering.Application.Commands;

public class CreateOrderCommandHandler(IOrderRepository orderRepository) : IRequestHandler<CreateOrderCommand, int>
{
    public async Task<int> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var entity = new Order(userId: "123",
            userName: request.CustomerName,
            address: new Address("", "", "", "", ""),
            cardTypeId: 1,
            cardNumber: "",
            cardSecurityNumber: "",
            cardHolderName: "",
            cardExpiration: DateTime.Now);

        entity.AddDomainEvent(new OrderCreatedEvent(entity));

        orderRepository.Add(entity);

        return entity.Id;
    }
}
