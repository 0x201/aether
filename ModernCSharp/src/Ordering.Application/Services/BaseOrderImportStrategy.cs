namespace ModernCSharp.Ordering.Application.Services;

public abstract class BaseOrderFileImportStrategy(ILogger logger, params FileType[] fileTypes)
    : FileImportStrategyBase<OrderDto>(fileTypes)
{
    public override async Task<ImportResult<OrderDto>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!FileIoUtils.ValidateImportContext<FileImportContext>(context))
            {
                logger.ZLogWarning($"Invalid import context provided for {context.FileType}");
                return ImportResult<OrderDto>.Failure([$"Invalid import context for {context.FileType}"]);
            }

            var orders = await PerformImportAsync(context, cancellationToken);
            logger.ZLogInformation($"Successfully imported {orders.Count} orders from {context.InputPath}");
            return ImportResult<OrderDto>.Success(orders);
        }
        catch (OperationCanceledException)
        {
            logger.ZLogError($"Import {context.FileType} operation  was cancelled.");
            return ImportResult<OrderDto>.Failure([$"Import {context.FileType} operation was cancelled."]);
        }
        catch (Exception ex)
        {
            logger.ZLogError($"An error occurred while importing orders from {context.InputPath}. Exception: {ex}");
            return HandleImportException(ex, context);
        }
    }

    protected abstract Task<List<OrderDto>> PerformImportAsync(IFileImportContext context, CancellationToken cancellationToken = default);

    protected virtual ImportResult<OrderDto> HandleImportException(Exception ex, IFileImportContext context)
    {
        return ImportResult<OrderDto>.Failure([$"An error occurred while importing orders from {context.InputPath}."]);
    }

}
