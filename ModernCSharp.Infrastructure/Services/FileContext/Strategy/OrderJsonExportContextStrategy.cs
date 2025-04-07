using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.Infrastructure.Services.FileExport.Commands;

namespace ModernCSharp.Infrastructure.Services.FileContext.Strategy;
internal class OrderJsonExportContextStrategy : IFileExportContextStrategy<Order>
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderJson;
    public IFileExportContext<Order> CreateContext(string outputPath, List<Order> data) => new OrderCsvExportContext(FileType.OrderJson, outputPath, data);
}
