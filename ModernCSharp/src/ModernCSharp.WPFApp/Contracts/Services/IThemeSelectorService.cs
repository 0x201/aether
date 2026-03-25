using ModernCSharp.WPFApp.Models;

namespace ModernCSharp.WPFApp.Contracts.Services;

public interface IThemeSelectorService
{
    void InitializeTheme();

    void SetTheme(AppTheme theme);

    AppTheme GetCurrentTheme();
}
