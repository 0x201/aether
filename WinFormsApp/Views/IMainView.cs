using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Models;

namespace ModernCSharp.WinFormsApp.Views;
public interface IMainView : IView
{
    event AsyncEventHandler ShowOrdersForm;
}
