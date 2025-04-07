using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Views;

namespace ModernCSharp.WinFormsApp.Presenters;
public class MainPresenter(
    IMainView view,
    IPresenter<IOrderListView> orderPresenter) : AbstractPresenter<IMainView>(view)
{
    public async override Task InitializeAsync()
    {
        View.ShowOrdersForm += OnShowOrdersForm;

        await base.InitializeAsync();
    }

    private async Task OnShowOrdersForm(object sender, EventArgs e)
    {
        await orderPresenter.InitializeAsync();

        if (orderPresenter.View is Form orderForm)
        {
            orderForm.ShowDialog();
        }
    }
}
