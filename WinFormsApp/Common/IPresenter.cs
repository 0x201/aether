namespace ModernCSharp.WinFormsApp.Common;

public interface IPresenter<TView>
    where TView : IView
{
    TView View { get; }
    Task InitializeAsync();
}
