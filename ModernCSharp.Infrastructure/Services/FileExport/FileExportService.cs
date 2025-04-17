using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.ApplicationCore.Utils;

namespace ModernCSharp.Infrastructure.Services.FileExport;

public class FileExportService<T>(
    IFileExportStrategyFactory<T> strategyFactory,
    ILogger<FileExportService<T>> logger) : IFileExportService<T>
{
    public async Task<Result> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!FileIoUtils.ValidateExportContext<IFileExportContext<T>, T>(context))
            {
                logger.LogWarning("Invalid import context provided.");
                return Result.Failure(FileExportErrors.InvalidContext);
            }

            var strategy = strategyFactory.GetStrategy(context);
            return await strategy.ExportAsync(cancellationToken);
        }
        catch (NotSupportedException ex)
        {
            return Result.Failure(new("", $"Unsupported file type. Error message: {ex.Message}"));
        }
        catch (Exception ex)
        {
            return Result.Failure(new("", $"Unsupported file type. Error message: {ex.Message}"));
        }

    }
}