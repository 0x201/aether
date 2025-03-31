using Microsoft.Extensions.Logging;

using ModernCSharp.Application.Models;
using ModernCSharp.Application.Models.Errors;
using ModernCSharp.Application.Models.FileExtraction;
using ModernCSharp.Application.Utils;

namespace ModernCSharp.Application.Services.FileExtraction;

public interface IFileImportService<T>
{
    Task<ImportResult<T>> ImportAsync(IFileImportContext context);
}

public class FileImportService<T>(
    IFileImportStrategyFactory<T> strategyFactory,
    ILogger<FileImportService<T>> logger) : IFileImportService<T>
{
    public async Task<ImportResult<T>> ImportAsync(IFileImportContext context)
    {
        try
        {
            if (!FileIoUtils.ValidateImportContext<IFileImportContext>(context))
            {
                logger.LogWarning("Invalid import context provided.");
                return ImportResult<T>.Failure(FileImportErrors.InvalidContext);
            }

            var strategy = strategyFactory.GetStrategy(context);
            return await strategy.ImportAsync();
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
