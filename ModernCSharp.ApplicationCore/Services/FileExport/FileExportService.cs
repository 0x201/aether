using Microsoft.Extensions.Logging;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.Errors;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.ApplicationCore.Utils;

namespace ModernCSharp.ApplicationCore.Services.FileExport;

public interface IFileExportService
{
    Task<IResult> ExportAsync(IFileExportContext context);
}

public class FileExportService(
    IFileExportStrategyFactory strategyFactory,
    ILogger<FileExportService> logger) : IFileExportService
{
    public async Task<IResult> ExportAsync(IFileExportContext context)
    {
        try
        {
            if (!FileIoUtils.ValidateExportContext<IFileExportContext>(context))
            {
                logger.LogWarning("Invalid import context provided.");
                return Result.Failure(FileExportErrors.InvalidContext);
            }

            var strategy = strategyFactory.GetStrategy(context);
            return await strategy.ExportAsync();
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