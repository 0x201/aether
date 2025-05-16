namespace ModernCSharp.Ordering.Domain.Utils;

public static class FileIoUtils
{
    public static bool ValidatePath(string path) => !path.Contains("..") && Path.IsPathRooted(path) && File.Exists(path);

    public static bool ValidateExportContext<TContext, TEntity>(IFileExportContext<TEntity> exportContext)
        where TContext : class, IFileExportContext<TEntity>
    {
        if (exportContext is not TContext context)
        {
            return false;
        }
        return !string.IsNullOrEmpty(context.OutputPath) && context.DataToExport.Any();
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
