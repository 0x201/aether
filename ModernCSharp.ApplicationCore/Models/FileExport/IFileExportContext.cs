using ModernCSharp.ApplicationCore.Enums;

namespace ModernCSharp.ApplicationCore.Models.FileExport;

public interface IFileExportContext<T>
{
    string OutputPath
    {
        get; set;
    }

    FileType FileType
    {
        get; set;
    }

    List<T> DataToExport { get; }
}
