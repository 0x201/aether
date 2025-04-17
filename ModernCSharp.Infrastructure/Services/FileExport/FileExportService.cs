using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.ApplicationCore.Utils;

namespace ModernCSharp.Infrastructure.Services.FileExport;

public class FileExportService<T>(
    IFileExportStrategyFactory<T> strategyFactory) : IFileExportService<T>
{
    public async Task<Result> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!FileIoUtils.ValidateExportContext<IFileExportContext<T>, T>(context))
            {
                return Result.Failure(["Invalid import context provided."]);
            }

            var strategy = strategyFactory.GetStrategy(context);
            return await strategy.ExportAsync(cancellationToken);
        }
        catch (NotSupportedException ex)
        {
            return Result.Failure([$"Unsupported file type. Error message: {ex.Message}"]);
        }
        catch (Exception ex)
        {
            return Result.Failure([$"Unsupported file type. Error message: {ex.Message}"]);
        }

    }
}