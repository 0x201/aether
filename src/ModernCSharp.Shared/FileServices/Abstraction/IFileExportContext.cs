namespace ModernCSharp.Shared.FileServices.Abstraction;

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

    IEnumerable<T> DataToExport
    {
        get;
    }
}