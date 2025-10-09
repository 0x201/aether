namespace ModernCSharp.Ordering.Application.Commands;

public class ExportOrderCommandHandler(IFileExportStrategyFactory<OrderDto> fileExportStrategyFactory) : IRequestHandler<ExportOrderCommand, Result>
{
    public Task<Result> Handle(ExportOrderCommand request, CancellationToken cancellationToken)
    {
        var strategy = fileExportStrategyFactory.GetStrategy(request.ExportContext.FileType);
        return strategy.ExportAsync(request.ExportContext, cancellationToken);
    }
}
