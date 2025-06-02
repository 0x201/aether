namespace ModernCSharp.WinFormsApp.Common;

public abstract class AbstractPresenter<TView>(TView view) : IPresenter<TView>
     where TView : class, IView
{
    public TView View { get; private set; } = view ?? throw new ArgumentNullException(nameof(view));

    public virtual Task InitializeAsync()
    {
        return Task.CompletedTask;
    }
}
