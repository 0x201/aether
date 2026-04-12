using System.Windows.Controls;

using MahApps.Metro.Controls;

using Aether.WPFApp.Contracts.Views;
using Aether.WPFApp.ViewModels;

namespace Aether.WPFApp.Views;

public partial class ShellWindow : MetroWindow, IShellWindow
{
    public ShellWindow(ShellViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }

    public Frame GetNavigationFrame()
        => shellFrame;

    public void ShowWindow()
        => Show();

    public void CloseWindow()
        => Close();
}
