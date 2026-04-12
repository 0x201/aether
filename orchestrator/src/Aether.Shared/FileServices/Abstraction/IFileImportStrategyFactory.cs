namespace Aether.Shared.FileServices.Abstraction;

public interface IFileImportStrategyFactory<T>
{
    IFileImportStrategy<T> GetStrategy(FileType fileType);
}