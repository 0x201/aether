using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.ApplicationCore.Utils;

namespace ModernCSharp.Infrastructure.Services.FileExtraction;

public class FileImportService<T>(
    IFileImportStrategyFactory<T> strategyFactory) : IFileImportService<T>
{
    public async Task<ImportResult<T>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!FileIoUtils.ValidateImportContext<IFileImportContext>(context))
            {
                return ImportResult<T>.Failure(["Invalid import context provided."]);
            }

            var strategy = strategyFactory.GetStrategy(context);
            return await strategy.ImportAsync(cancellationToken);
        }
        catch (NotSupportedException ex)
        {
            return ImportResult<T>.Failure([$"Unsupported file type. Error message: {ex.Message}"]);
        }
        catch (Exception ex)
        {
            return ImportResult<T>.Failure([$"Unsupported file type. Error message: {ex.Message}"]);
        }
    }
}
