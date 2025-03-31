using ModernCSharp.Application.Enums;
using ModernCSharp.Application.Services.FileExport.Commands;

namespace ModernCSharp.Application.Models.FileExport;

public class FileExportContext : IFileExportContext
{
    public string OutputPath
    {
        get;
        set;
    }
    public FileType FileType
    {
        get;
        set;
    }

    protected FileExportContext(FileType fileType, string outputPath)
    {
        FileType = fileType;
        OutputPath = outputPath;
    }

    public static IFileExportContext Create(FileType fileType, string outputPath)
    {
        return fileType switch
        {
            FileType.OrderCsv => new OrderCsvExportContext(fileType, outputPath),
            FileType.OrderJson => new OrderJsonExportContext(fileType, outputPath),
            FileType.OrderExcel => new OrderExcelExportContext(fileType, outputPath),
            _ => throw new NotSupportedException($"Unsupported file type: {fileType}")
        };
    }
}