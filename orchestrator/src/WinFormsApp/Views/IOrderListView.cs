using System.ComponentModel;

namespace Aether.WinFormsApp.Views;

public interface IOrderListView : IView
{
    BindingList<OrderDto> Orders
    {
        get;
        set;
    }
    string ExportFilePath
    {
        get;
        set;
    }
    event AsyncEventHandler<OperationMode> ShowImportOrdersView;
    event AsyncEventHandler<ExportOrdersEventArgs> ExportOrders;
    event EventHandler ShowClearOrdersConfirmation;
    void DisplayData(IEnumerable<OrderDto> orders);
}
