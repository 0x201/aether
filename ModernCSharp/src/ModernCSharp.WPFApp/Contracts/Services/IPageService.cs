using System.Windows.Controls;

namespace ModernCSharp.WPFApp.Contracts.Services;

public interface IPageService
{
    Type GetPageType(string key);

    Page GetPage(string key);
}
