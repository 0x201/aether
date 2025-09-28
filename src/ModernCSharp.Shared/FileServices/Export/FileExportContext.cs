namespace ModernCSharp.Shared.FileServices.Export;

public class FileExportContext<T>(FileType fileType, string outputPath, IReadOnlyCollection<T> dataToExport) : IFileExportContext<T>
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

    public IReadOnlyCollection<T> DataToExport
    {
        get;
    } = dataToExport;
}
