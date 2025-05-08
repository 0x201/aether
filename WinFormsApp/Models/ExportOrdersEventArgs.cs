using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.WinFormsApp.Models;
public class ExportOrdersEventArgs
{
    public List<Order> OrderToExport
    {
        get;
        set;
    }
    public string ExportFilePath
    {
        get;
        set;
    }
}
