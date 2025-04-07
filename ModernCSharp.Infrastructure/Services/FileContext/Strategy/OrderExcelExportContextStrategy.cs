using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.Infrastructure.Services.FileExport.Commands;

namespace ModernCSharp.Infrastructure.Services.FileContext.Strategy;
internal class OrderExcelExportContextStrategy : IFileExportContextStrategy<Order>
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderExcel;
    public IFileExportContext<Order> CreateContext(string outputPath, List<Order> data) => new OrderCsvExportContext(FileType.OrderExcel, outputPath, data);
}
