using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.Infrastructure.Services.FileExtraction.Commands;

namespace ModernCSharp.Infrastructure.Services.FileContext.Strategy;
internal class OrderCsvImportContextStrategy : IFileImportContextStrategy
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderCsv;
    public IFileImportContext CreateContext(string outputPath) => new OrderCsvImportContext(FileType.OrderCsv, outputPath);
}
