using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Services.FileExtraction.Commands;

namespace ModernCSharp.ApplicationCore.Models.FileExtraction;

public class FileImportContext : IFileImportContext
{
    public string InputPath
    {
        get;
        set;
    }
    public FileType FileType
    {
        get;
        set;
    }

    protected FileImportContext(FileType fileType, string inputPath)
    {
        FileType = fileType;
        InputPath = inputPath;
    }
    public static IFileImportContext Create(FileType fileType, string inputPath)
    {
        return fileType switch
        {
            FileType.OrderCsv => new OrderCsvImportContext(fileType, inputPath),
            FileType.OrderJson => new OrderJsonImportContext(fileType, inputPath),
            FileType.OrderExcel => new OrderExcelImportContext(fileType, inputPath),
            _ => throw new NotSupportedException($"Unsupported file type: {fileType}")
        };
    }
}
