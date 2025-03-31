using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExtraction;

namespace ModernCSharp.ApplicationCore.Abstractions;

public interface IFileImportStrategy<T>
{
    List<FileType> FileTypes { get; }
    void InitializeContext(IFileImportContext context);
    Task<ImportResult<T>> ImportAsync(CancellationToken cancellationToken = default);
    bool CanImport(FileType fileType) => FileTypes.Contains(fileType);
}
