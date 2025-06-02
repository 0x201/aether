using Microsoft.UI.Xaml.Controls;

namespace ModernCSharp.WinUIApp.Controls;

public sealed partial class AddOrderDialog : UserControl
{
    public string Company => CompanyTextBox.Text;
    public string OrderStatus => OrderStatusTextBox.Text;

    public AddOrderDialog()
    {
        InitializeComponent();
    }
}
