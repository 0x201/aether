using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExtraction;

namespace ModernCSharp.ApplicationCore.Services.FileExtraction.Commands;

public class OrderExcelImportContext(FileType fileType, string inputPath) : FileImportContext(fileType, inputPath);
