namespace ModernCSharp.Ordering.Infrastructure.Services.FileExtraction.Commands;

internal class OrderJsonImportContext(FileType fileType, string inputPath) : FileImportContext(fileType, inputPath);
