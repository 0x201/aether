using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExtraction;

namespace ModernCSharp.Infrastructure.Services.FileExtraction.Commands;

public class OrderJsonImportContext(FileType fileType, string inputPath) : FileImportContext(fileType, inputPath);
