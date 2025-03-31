using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.Errors;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.ApplicationCore.Utils;

namespace ModernCSharp.Infrastructure.Services.FileExtraction;

public class FileImportService<T>(
    IFileImportStrategyFactory<T> strategyFactory,
    ILogger<FileImportService<T>> logger) : IFileImportService<T>
{
    public async Task<ImportResult<T>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!FileIoUtils.ValidateImportContext<IFileImportContext>(context))
            {
                logger.LogWarning("Invalid import context provided.");
                return ImportResult<T>.Failure(FileImportErrors.InvalidContext);
            }

            var strategy = strategyFactory.GetStrategy(context);
            return await strategy.ImportAsync(cancellationToken);
        }
        catch (NotSupportedException ex)
        {
            return ImportResult<T>.Failure(new("", $"Unsupported file type. Error message: {ex.Message}"));
        }
        catch (Exception ex)
        {
            return ImportResult<T>.Failure(new("", $"Unsupported file type. Error message: {ex.Message}"));
        }
    }
}
