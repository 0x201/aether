namespace Aether.WinFormsApp.Common;

public interface IPresenter<TView>
    where TView : IView
{
    TView View { get; }
    Task InitializeAsync();
}
