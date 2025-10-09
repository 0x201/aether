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
                logger.LogWarning("Invalid export context provided for {FileType}", context.FileType);
                return Result.Failure([$"Invalid export context for {context.FileType}"]);
            }

            if (context.DataToExport.Count == 0)
            {
                logger.LogInformation("No order to export for {FileType}", context.FileType);
                return Result.Success();
            }

            await PerformExportAsync(context, cancellationToken);
            logger.LogInformation("Successfully exported {Count} orders to {OutputPath}",
                context.DataToExport.Count, context.OutputPath);
            return Result.Success();
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Export {FileType} operation  was cancelled.", context.FileType);
            return Result.Failure([$"Export {context.FileType} operation  was cancelled."]);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while exporting orders to {OutputPath}.", context.OutputPath);
            return HandleExportException(ex, context);
        }
    }

    protected abstract Task PerformExportAsync(IFileExportContext<OrderDto> context, CancellationToken cancellationToken = default);

    protected virtual Result HandleExportException(Exception ex, IFileExportContext<OrderDto> context)
    {
        return Result.Failure([$"An error occurred while exporting orders to {context.OutputPath}."]);
    }

}
