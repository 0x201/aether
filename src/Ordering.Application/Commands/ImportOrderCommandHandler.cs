using ModernCSharp.Shared.FileServices.Abstraction;

using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Commands;

public class ImportOrderCommandHandler(IFileImportStrategyFactory<Order> fileImportStrategyFactory) : IRequestHandler<ImportOrderCommand, ImportResult<Order>>
{
    public Task<ImportResult<Order>> Handle(ImportOrderCommand request, CancellationToken cancellationToken)
    {
        var strategy = fileImportStrategyFactory.GetStrategy(request.ImportContext);
        return strategy.ImportAsync(cancellationToken);
    }
}
