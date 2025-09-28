namespace ModernCSharp.WinFormsApp.Models;

public class ExportOrdersEventArgs
{
    public IReadOnlyCollection<Order> OrderToExport
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
