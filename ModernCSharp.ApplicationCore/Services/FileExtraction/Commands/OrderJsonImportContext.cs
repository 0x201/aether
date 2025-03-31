using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExtraction;

namespace ModernCSharp.ApplicationCore.Services.FileExtraction.Commands;

public class OrderJsonImportContext(FileType fileType, string inputPath) : FileImportContext(fileType, inputPath);
