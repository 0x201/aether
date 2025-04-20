namespace ModernCSharp.WinFormsApp.Common;

public interface IView
{
    void ShowMessage(string message, string title);
    void ShowError(string message);
    void ShowView();
    void CloseView();
}
