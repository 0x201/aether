using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Enums;
using ModernCSharp.WinFormsApp.Models;

namespace ModernCSharp.WinFormsApp.Views;

public interface IImportView : IView
{
    OperationMode Mode
    {
        get;
        set;
    }
    event AsyncEventHandler<OperationMode> ImportRequested;
    string FilePath
    {
        get; set;
    }
}
