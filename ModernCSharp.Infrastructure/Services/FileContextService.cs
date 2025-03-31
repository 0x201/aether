using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.Infrastructure.Services.FileExport.Commands;
using ModernCSharp.Infrastructure.Services.FileExtraction.Commands;

namespace ModernCSharp.Infrastructure.Services;

public class OrderCsvExportContextStrategy : IFileExportContextStrategy<Order>
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderCsv;
    public IFileExportContext<Order> CreateContext(string outputPath, List<Order> data) => new OrderCsvExportContext(FileType.OrderCsv, outputPath, data);
}

public class OrderExcelExportContextStrategy : IFileExportContextStrategy<Order>
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderExcel;
    public IFileExportContext<Order> CreateContext(string outputPath, List<Order> data) => new OrderExcelExportContext(FileType.OrderExcel, outputPath, data);
}

public class OrderJsonExportContextStrategy : IFileExportContextStrategy<Order>
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderJson;
    public IFileExportContext<Order> CreateContext(string outputPath, List<Order> data) => new OrderJsonExportContext(FileType.OrderJson, outputPath, data);
}

public interface IFileExportContextStrategy<T>
{
    bool CanHandle(FileType fileType);
    IFileExportContext<T> CreateContext(string outputPath, List<T> data);
}

public class ExportContextFactory<T>(IEnumerable<IFileExportContextStrategy<T>> strategies)
{
    public IFileExportContext<T> CreateContext(FileType fileType, string outputPath, List<T> dataToExport)
    {
        var strategy = strategies.FirstOrDefault(s => s.CanHandle(fileType));
        return strategy?.CreateContext(outputPath, dataToExport) ??
            throw new NotSupportedException($"Unsupported file type: {fileType}");
    }
} 

public class OrderCsvImportContextStrategy : IFileImportContextStrategy
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderCsv;
    public IFileImportContext CreateContext(string outputPath) => new OrderCsvImportContext(FileType.OrderCsv, outputPath);
}

public class OrderExcelImportContextStrategy : IFileImportContextStrategy
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderExcel;
    public IFileImportContext CreateContext(string outputPath) => new OrderExcelImportContext(FileType.OrderExcel, outputPath);
}

public class OrderJsonImportContextStrategy : IFileImportContextStrategy
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderJson;
    public IFileImportContext CreateContext(string outputPath) => new OrderJsonImportContext(FileType.OrderJson, outputPath);
}

public interface IFileImportContextStrategy
{
    bool CanHandle(FileType fileType);
    IFileImportContext CreateContext(string outputPath);
}

public class ImportContextFactory(IEnumerable<IFileImportContextStrategy> strategies)
{
    public IFileImportContext CreateContext(FileType fileType, string outputPath)
    {
        var strategy = strategies.FirstOrDefault(s => s.CanHandle(fileType));
        return strategy?.CreateContext(outputPath) ??
            throw new NotSupportedException($"Unsupported file type: {fileType}");
    }
}