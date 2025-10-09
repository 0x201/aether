namespace ModernCSharp.WinFormsApp.Models;

public class ExportOrdersEventArgs
{
    public IReadOnlyCollection<OrderDto> OrderToExport
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
