using ModernCSharp.Application.Enums;
using ModernCSharp.Application.Models.FileExtraction;

namespace ModernCSharp.Application.Services.FileExtraction.Commands;

public class OrderExcelImportContext(FileType fileType, string inputPath) : FileImportContext(fileType, inputPath);
