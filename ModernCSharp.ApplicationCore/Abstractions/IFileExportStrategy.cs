using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;

namespace ModernCSharp.ApplicationCore.Abstractions;

public interface IFileExportStrategy
{
    List<FileType> FileTypes { get; }
    void InitializeContext(IFileExportContext context);
    Task<IResult> ExportAsync(CancellationToken cancellationToken = default);
    bool CanExport(FileType fileType) => FileTypes.Contains(fileType);
}