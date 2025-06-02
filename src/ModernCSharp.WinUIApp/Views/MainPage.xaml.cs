using Microsoft.UI.Xaml.Controls;

using ModernCSharp.WinUIApp.ViewModels;

namespace ModernCSharp.WinUIApp.Views;

public sealed partial class MainPage : Page
{
    public MainViewModel ViewModel
    {
        get;
    }

    public MainPage()
    {
        ViewModel = App.GetService<MainViewModel>();
        InitializeComponent();
    }
}
