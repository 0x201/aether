using System.Windows.Controls;

using ModernCSharp.WPFApp.ViewModels;

namespace ModernCSharp.WPFApp.Views;

public partial class OrderListDetailsPage : Page
{
    public OrderListDetailsPage(OrderListDetailsViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
