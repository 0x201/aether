using ModernCSharp.ApplicationCore.Enums;

namespace ModernCSharp.ApplicationCore.Models.FileExport;

public interface IFileExportContext
{
    string OutputPath
    {
        get; set;
    }

    FileType FileType
    {
        get; set;
    }
}
