using System.Windows.Controls;

using Aether.WPFApp.ViewModels;

namespace Aether.WPFApp.Views;

public partial class MainPage : Page
{
    public MainPage(MainViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
