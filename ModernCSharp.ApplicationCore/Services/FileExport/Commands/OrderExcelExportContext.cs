using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExport;

namespace ModernCSharp.ApplicationCore.Services.FileExport.Commands;
public class OrderExcelExportContext(FileType fileType, string outputPath) : FileExportContext(fileType, outputPath);
