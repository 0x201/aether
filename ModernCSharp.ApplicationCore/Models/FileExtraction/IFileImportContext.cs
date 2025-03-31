using ModernCSharp.ApplicationCore.Enums;

namespace ModernCSharp.ApplicationCore.Models.FileExtraction;

public interface IFileImportContext
{
    FileType FileType
    {
        get; set;
    }
    string InputPath
    {
        get; set;
    }
}

