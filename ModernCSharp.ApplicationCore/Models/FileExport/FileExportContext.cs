using ModernCSharp.ApplicationCore.Enums;

namespace ModernCSharp.ApplicationCore.Models.FileExport;

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

    public List<T> DataToExport
    {
        get;
    } = [];

    protected FileExportContext(FileType fileType, string outputPath, List<T> dataToExport)
    {
        FileType = fileType;
        OutputPath = outputPath;
        DataToExport = dataToExport;
    }
}