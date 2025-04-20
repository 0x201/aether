using ModernCSharp.Domain.Entities;

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
