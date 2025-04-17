using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.Domain.Entities;
using ModernCSharp.Infrastructure.Services.FileExport.Commands;

namespace ModernCSharp.Infrastructure.Services.FileContext.Strategy;
internal class OrderCsvExportContextStrategy : IFileExportContextStrategy<Order>
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderCsv;
    public IFileExportContext<Order> CreateContext(string outputPath, List<Order> data) => new OrderCsvExportContext(FileType.OrderCsv, outputPath, data);
}
