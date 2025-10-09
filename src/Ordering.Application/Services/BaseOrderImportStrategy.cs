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
                logger.LogWarning("Invalid import context provided for {FileType}", context.FileType);
                return ImportResult<OrderDto>.Failure([$"Invalid import context for {context.FileType}"]);
            }

            var orders = await PerformImportAsync(context, cancellationToken);
            logger.LogInformation("Successfully imported {Count} orders from {InputPath}",
                orders.Count, context.InputPath);
            return ImportResult<OrderDto>.Success(orders);
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Import {FileType} operation  was cancelled.", context.FileType);
            return ImportResult<OrderDto>.Failure([$"Import {context.FileType} operation was cancelled."]);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while importing orders from {OutputPath}.", context.InputPath);
            return HandleImportException(ex, context);
        }
    }

    protected abstract Task<List<OrderDto>> PerformImportAsync(IFileImportContext context, CancellationToken cancellationToken = default);

    protected virtual ImportResult<OrderDto> HandleImportException(Exception ex, IFileImportContext context)
    {
        return ImportResult<OrderDto>.Failure([$"An error occurred while importing orders from {context.InputPath}."]);
    }

}
