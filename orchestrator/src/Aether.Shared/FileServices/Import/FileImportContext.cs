namespace Aether.Shared.FileServices.Import;

public class FileImportContext(FileType fileType, string inputPath) : IFileImportContext
{
    public string InputPath
    {
        get;
        set;
    } = inputPath;
    public FileType FileType
    {
        get;
        set;
    } = fileType;
}
