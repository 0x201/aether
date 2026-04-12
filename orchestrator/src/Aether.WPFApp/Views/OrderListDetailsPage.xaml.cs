using System.Windows.Controls;

using Aether.WPFApp.ViewModels;

namespace Aether.WPFApp.Views;

public partial class OrderListDetailsPage : Page
{
    public OrderListDetailsPage(OrderListDetailsViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
