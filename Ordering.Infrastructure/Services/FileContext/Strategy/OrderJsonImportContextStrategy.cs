using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.Infrastructure.Services.FileExtraction.Commands;

namespace ModernCSharp.Infrastructure.Services.FileContext.Strategy;
internal class OrderJsonImportContextStrategy : IFileImportContextStrategy
{
    public bool CanHandle(FileType fileType) => fileType == FileType.OrderJson;
    public IFileImportContext CreateContext(string outputPath) => new OrderJsonImportContext(FileType.OrderJson, outputPath);
}
