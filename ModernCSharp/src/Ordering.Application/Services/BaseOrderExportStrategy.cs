namespace ModernCSharp.Ordering.Application.Services;

public abstract class BaseOrderFileExportStrategy<T>(ILogger logger, params FileType[] fileTypes) : FileExportStrategyBase<OrderDto>(fileTypes)
{
    public override async Task<Result> ExportAsync(IFileExportContext<OrderDto> context, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!FileIoUtils.ValidateExportContext<FileExportContext<OrderDto>, OrderDto>(context))
            {
                logger.ZLogWarning($"Invalid export context provided for {context.FileType}");
                return Result.Failure([$"Invalid export context for {context.FileType}"]);
            }

            if (context.DataToExport.Count == 0)
            {
                logger.ZLogInformation($"No order to export for {context.FileType}");
                return Result.Success();
            }

            await PerformExportAsync(context, cancellationToken);
            logger.ZLogInformation($"Successfully exported {context.DataToExport.Count} orders to {context.OutputPath}");
            return Result.Success();
        }
        catch (OperationCanceledException)
        {
            logger.ZLogError($"Export {context.OutputPath} operation  was cancelled.");
            return Result.Failure([$"Export {context.FileType} operation  was cancelled."]);
        }
        catch (Exception ex)
        {
            logger.ZLogError($"An error occurred while exporting orders to {context.OutputPath}. Exception: {ex}");
            return HandleExportException(ex, context);
        }
    }

    protected abstract Task PerformExportAsync(IFileExportContext<OrderDto> context, CancellationToken cancellationToken = default);

    protected virtual Result HandleExportException(Exception ex, IFileExportContext<OrderDto> context)
    {
        return Result.Failure([$"An error occurred while exporting orders to {context.OutputPath}."]);
    }

}
