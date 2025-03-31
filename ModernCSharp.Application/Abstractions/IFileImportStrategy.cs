using ModernCSharp.Application.Enums;
using ModernCSharp.Application.Models;
using ModernCSharp.Application.Models.FileExtraction;

namespace ModernCSharp.Application.Abstractions;

public interface IFileImportStrategy<T>
{
    List<FileType> FileTypes { get; }
    void InitializeContext(IFileImportContext context);
    Task<ImportResult<T>> ImportAsync(CancellationToken cancellationToken = default);
    bool CanImport(FileType fileType) => FileTypes.Contains(fileType);
}
