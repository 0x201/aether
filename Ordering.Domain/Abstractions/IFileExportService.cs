namespace ModernCSharp.Ordering.Domain.Abstractions;

public interface IFileExportService<T>
{
    Task<Result> ExportAsync(IFileExportContext<T> context, CancellationToken cancellationToken = default);
}
