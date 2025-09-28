using ModernCSharp.Shared.FileServices.Abstraction;
using ModernCSharp.Shared.Utils;
using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.Ordering.Application.Services;

public abstract class BaseOrderFileImportStrategy(ILogger logger, params FileType[] fileTypes) 
    : FileImportStrategyBase<Order>(fileTypes)
{
    public override async Task<ImportResult<Order>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!FileIoUtils.ValidateImportContext<FileImportContext>(context))
            {
                logger.LogWarning("Invalid import context provided for {FileType}", context.FileType);
                return ImportResult<Order>.Failure([$"Invalid import context for {context.FileType}"]);
            }

            var orders = await PerformImportAsync(context, cancellationToken);
            logger.LogInformation("Successfully imported {Count} orders from {InputPath}",
                orders.Count, context.InputPath);
            return ImportResult<Order>.Success(orders);
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Import {FileType} operation  was cancelled.", context.FileType);
            return ImportResult<Order>.Failure([$"Import {context.FileType} operation was cancelled."]);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while importing orders from {OutputPath}.", context.InputPath);
            return HandleImportException(ex, context);
        }
    }

    protected abstract Task<List<Order>> PerformImportAsync(IFileImportContext context, CancellationToken cancellationToken = default);

    protected virtual ImportResult<Order> HandleImportException(Exception ex, IFileImportContext context)
    {
        return ImportResult<Order>.Failure([$"An error occurred while importing orders from {context.InputPath}."]);
    }

}