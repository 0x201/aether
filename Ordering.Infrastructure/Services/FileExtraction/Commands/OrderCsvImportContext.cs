namespace ModernCSharp.Ordering.Infrastructure.Services.FileExtraction.Commands;

internal class OrderCsvImportContext(FileType fileType, string inputPath) : FileImportContext(fileType, inputPath);
