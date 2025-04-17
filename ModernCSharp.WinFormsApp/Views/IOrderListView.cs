using System.ComponentModel;

using ModernCSharp.Domain.Entities;
using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Enums;
using ModernCSharp.WinFormsApp.Models;

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
