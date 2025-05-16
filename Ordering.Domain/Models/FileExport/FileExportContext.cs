namespace ModernCSharp.Ordering.Domain.Models.FileExport;

public class FileExportContext<T> : IFileExportContext<T>
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

    public IEnumerable<T> DataToExport
    {
        get;
    } = [];

    protected FileExportContext(FileType fileType, string outputPath, IEnumerable<T> dataToExport)
    {
        FileType = fileType;
        OutputPath = outputPath;
        DataToExport = dataToExport;
    }
}
