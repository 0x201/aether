using System.Windows.Controls;

namespace ModernCSharp.WPFApp.Contracts.Views;

public interface IShellWindow
{
    Frame GetNavigationFrame();

    void ShowWindow();

    void CloseWindow();
}
