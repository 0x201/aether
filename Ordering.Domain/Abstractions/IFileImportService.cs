namespace ModernCSharp.Ordering.Domain.Abstractions;

public interface IFileImportService<T>
{
    Task<ImportResult<T>> ImportAsync(IFileImportContext context, CancellationToken cancellationToken = default);
}
