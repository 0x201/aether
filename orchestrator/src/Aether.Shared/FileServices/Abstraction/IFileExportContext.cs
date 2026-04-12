namespace Aether.Shared.FileServices.Abstraction;

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

    IReadOnlyCollection<T> DataToExport
    {
        get;
    }
}