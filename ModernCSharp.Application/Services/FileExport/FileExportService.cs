using Microsoft.Extensions.Logging;
using ModernCSharp.Application.Models;
using ModernCSharp.Application.Models.Errors;
using ModernCSharp.Application.Models.FileExport;
using ModernCSharp.Application.Utils;

namespace ModernCSharp.Application.Services.FileExport;

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