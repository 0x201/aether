namespace ModernCSharp.WinFormsApp.Views;

public interface IImportView : IView
{
    OperationMode Mode
    {
        get;
        set;
    }
    event AsyncEventHandler<OperationMode> ImportRequested;
    string FilePath
    {
        get; set;
    }
}
