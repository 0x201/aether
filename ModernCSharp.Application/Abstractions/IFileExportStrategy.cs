using ModernCSharp.Application.Enums;
using ModernCSharp.Application.Models;
using ModernCSharp.Application.Models.FileExport;

namespace ModernCSharp.Application.Abstractions;

public interface IFileExportStrategy
{
    List<FileType> FileTypes { get; }
    void InitializeContext(IFileExportContext context);
    Task<IResult> ExportAsync(CancellationToken cancellationToken = default);
    bool CanExport(FileType fileType) => FileTypes.Contains(fileType);
}