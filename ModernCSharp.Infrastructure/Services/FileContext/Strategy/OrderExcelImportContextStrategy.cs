using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.Infrastructure.Services.FileExtraction.Commands;

namespace ModernCSharp.Infrastructure.Services.FileContext.Strategy;
internal class OrderExcelImportContextStrategy : IFileImportContextStrategy
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderExcel;
    public IFileImportContext CreateContext(string outputPath) => new OrderExcelImportContext(FileType.OrderExcel, outputPath);
}
