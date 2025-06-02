namespace ModernCSharp.Ordering.Infrastructure.Services.FileExtraction.Commands;

internal class OrderExcelImportContext(FileType fileType, string inputPath) : FileImportContext(fileType, inputPath);
