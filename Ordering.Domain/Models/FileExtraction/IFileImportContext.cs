namespace ModernCSharp.Ordering.Domain.Models.FileExtraction;

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

