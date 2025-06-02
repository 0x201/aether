using System.Windows.Controls;

using ModernCSharp.WPFApp.ViewModels;

namespace ModernCSharp.WPFApp.Views;

public partial class OrderDataGridPage : Page
{
    public OrderDataGridPage(OrderDataGridViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
