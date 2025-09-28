namespace ModernCSharp.Shared.FileServices.Abstraction;

public interface IFileExportStrategyFactory<T>
{
    IFileExportStrategy<T> GetStrategy(FileType fileType);
}