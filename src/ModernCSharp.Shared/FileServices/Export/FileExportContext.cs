namespace ModernCSharp.Shared.FileServices.Export;

public class FileExportContext<T>(FileType fileType, string outputPath, IEnumerable<T> dataToExport) : IFileExportContext<T>
{
    public string OutputPath
    {
        get;
        set;
    } = outputPath;
    public FileType FileType
    {
        get;
        set;
    } = fileType;

    public IEnumerable<T> DataToExport
    {
        get;
    } = dataToExport;
}
