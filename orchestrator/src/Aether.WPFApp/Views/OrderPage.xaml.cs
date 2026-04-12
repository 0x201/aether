using System.Windows.Controls;

using Microsoft.Win32;

using Aether.WPFApp.ViewModels;

namespace Aether.WPFApp.Views;

public partial class OrderPage : Page
{
    public OrderViewModel ViewModel
    {
        get;
    }

    public OrderPage()
    {
        ViewModel = App.GetService<OrderViewModel>();
        InitializeComponent();
    }

    private void OpenFileDialogButton_Click(object sender, System.Windows.RoutedEventArgs e)
    {
        var openFileDialog = new OpenFileDialog();

        var result = openFileDialog.ShowDialog();

        if (result == true)
        {

        }
    }
}
