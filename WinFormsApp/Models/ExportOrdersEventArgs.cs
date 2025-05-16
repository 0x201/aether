using ModernCSharp.Ordering.Application.Queries;

namespace ModernCSharp.WinFormsApp.Models;
public class ExportOrdersEventArgs
{
    public IEnumerable<Order> OrderToExport
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
