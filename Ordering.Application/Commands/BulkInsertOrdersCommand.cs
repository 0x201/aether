namespace ModernCSharp.Ordering.Application.Commands;

public class BulkInsertOrdersCommand : IRequest<bool>
{
    public List<CreateOrderCommand> OrdersToInsert { get; set; } = [];
}
