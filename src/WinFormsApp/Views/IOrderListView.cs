using System.ComponentModel;

namespace ModernCSharp.WinFormsApp.Views;

public interface IOrderListView : IView
{
    BindingList<Order> Orders
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
    void DisplayData(IEnumerable<Order> orders);
}
