using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Models.FileExtraction;

namespace ModernCSharp.ApplicationCore.Abstractions;


public interface IFileImportService<T>
{
    Task<ImportResult<T>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default);
}
