using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;

namespace ModernCSharp.ApplicationCore.Abstractions;

public interface IFileExportService<T>
{
    Task<IResult> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default);
}