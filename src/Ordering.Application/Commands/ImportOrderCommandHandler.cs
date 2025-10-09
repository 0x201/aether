namespace ModernCSharp.Ordering.Application.Commands;

public class ImportOrderCommandHandler(IFileImportStrategyFactory<OrderDto> fileImportStrategyFactory) : IRequestHandler<ImportOrderCommand, ImportResult<OrderDto>>
{
    public Task<ImportResult<OrderDto>> Handle(ImportOrderCommand request, CancellationToken cancellationToken)
    {
        var strategy = fileImportStrategyFactory.GetStrategy(request.ImportContext.FileType);
        return strategy.ImportAsync(request.ImportContext, cancellationToken);
    }
}
