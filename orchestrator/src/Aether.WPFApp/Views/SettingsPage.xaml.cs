using System.Windows.Controls;

using Aether.WPFApp.ViewModels;

namespace Aether.WPFApp.Views;

public partial class SettingsPage : Page
{
    public SettingsPage(SettingsViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
