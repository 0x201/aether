using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.ApplicationCore.Models.FileExtraction;

namespace ModernCSharp.ApplicationCore.Utils;

public static class FileIoUtils
{
    public static bool ValidatePath(string path) => !path.Contains("..") && Path.IsPathRooted(path) && File.Exists(path);

    public static bool ValidateExportContext<TContext>(IFileExportContext exportContext)
        where TContext : IFileExportContext
    {
        if (exportContext is TContext context)
        {
            return !string.IsNullOrEmpty(context.OutputPath);
        }
        return false;
    }
    public static bool ValidateImportContext<TContext>(IFileImportContext importContext) 
        where TContext : IFileImportContext
    {
        if (importContext is TContext context)
        {
            return ValidatePath(context.InputPath);
        }

        return false;
    }

    public static FileType MapToFileType(string fileExtension)
    {
        return fileExtension.ToUpper() switch
        {
            ".JSON" => FileType.OrderJson,
            ".CSV" => FileType.OrderCsv,
            ".XLSX" => FileType.OrderExcel,
            _ => throw new Exception("Unsupported file type")
        };
    }
}
