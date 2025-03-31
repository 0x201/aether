using ModernCSharp.Application.Enums;
using ModernCSharp.Application.Models.FileExport;

namespace ModernCSharp.Application.Services.FileExport.Commands;

public class OrderJsonExportContext(FileType fileType, string outputPath) : FileExportContext(fileType, outputPath);
