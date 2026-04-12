using System.Windows.Controls;

namespace Aether.WPFApp.Contracts.Services;

public interface IPageService
{
    Type GetPageType(string key);

    Page GetPage(string key);
}
