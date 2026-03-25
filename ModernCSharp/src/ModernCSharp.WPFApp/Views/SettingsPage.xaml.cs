using System.Windows.Controls;

using ModernCSharp.WPFApp.ViewModels;

namespace ModernCSharp.WPFApp.Views;

public partial class SettingsPage : Page
{
    public SettingsPage(SettingsViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
