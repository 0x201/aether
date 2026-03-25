namespace ModernCSharp.Shared.FileServices.Abstraction;

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