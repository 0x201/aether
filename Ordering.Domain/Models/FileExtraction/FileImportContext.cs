namespace ModernCSharp.Ordering.Domain.Models.FileExtraction;

public class FileImportContext : IFileImportContext
{
    public string InputPath
    {
        get;
        set;
    }
    public FileType FileType
    {
        get;
        set;
    }

    protected FileImportContext(FileType fileType, string inputPath)
    {
        FileType = fileType;
        InputPath = inputPath;
    }
}
