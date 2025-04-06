using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Enums;
using ModernCSharp.WinFormsApp.Models;

namespace ModernCSharp.WinFormsApp.Views;

public interface IOrderListView : IView
{
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
