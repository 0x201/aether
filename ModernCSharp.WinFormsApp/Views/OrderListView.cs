using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Presenters;

using System.ComponentModel;

namespace ModernCSharp.WinFormsApp.Views;

public partial class OrderListView : Form, IView<OrdersListPresenter>
{
    private readonly ImportOrdersView _importOrdersView;
    public BindingList<Order> DataSource { get; set; }

    public OrdersListPresenter Presenter { get; set; }

    public OrderListView()
    {
        InitializeComponent();
    }

    public OrderListView(
        OrdersListPresenter ordersPresenter,
        ImportOrdersView importOrdersView) : this()
    {
        Presenter = ordersPresenter;
        _importOrdersView = importOrdersView;
    }

    private async void OrderListView_Load(object sender, EventArgs e)
    {
        _importOrdersView.ImportCompleted += async () => await UpdateData();

        DataSource = new BindingList<Order>(await Presenter.GetOrders());
        OrderDataGridView.DataSource = DataSource;
    }

    private void ImportOrdersButton_Click(object sender, EventArgs e)
    {
        _importOrdersView.Show();
    }


    public async Task UpdateData()
    {
        DataSource = new BindingList<Order>(await Presenter.GetOrders());
        OrderDataGridView.Refresh();
    }

}
