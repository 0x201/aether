using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;

namespace ModernCSharp.ApplicationCore.Abstractions;

public interface IFileExportService<T>
{
    Task<Result> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default);
}