using System.Windows.Controls;

using Aether.WPFApp.ViewModels;

namespace Aether.WPFApp.Views;

public partial class OrderDataGridPage : Page
{
    public OrderDataGridPage(OrderDataGridViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
