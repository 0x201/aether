namespace ModernCSharp.Shared.FileServices.Abstraction;

public interface IFileImportStrategyFactory<T>
{
    IFileImportStrategy<T> GetStrategy(IFileImportContext context);
}