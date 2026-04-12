namespace Aether.WinFormsApp.Presenters;

public class OrdersListPresenter(
    IOrderListView view,
    IServiceProvider serviceProvider,
    IMediator mediator,
    IOrderQueries orderService) : AbstractPresenter<IOrderListView>(view)
{
    private List<OrderDto> _orders;

    public async override Task InitializeAsync()
    {
        View.ShowImportOrdersView += OnShowImportOrdersView;
        View.ShowClearOrdersConfirmation += OnShowClearOrdersConfirmation;
        View.ExportOrders += OnExportOrders;
        _orders = await GetOrders();
        View.DisplayData(_orders);

        await base.InitializeAsync();
    }

    private async Task OnExportOrders(object sender, ExportOrdersEventArgs e)
    {
        if (!File.Exists(e.ExportFilePath))
        {
            Directory.CreateDirectory(e.ExportFilePath);
        }

        var outputFileName = Path.Combine(e.ExportFilePath, "orders.csv");

        var context = new FileExportContext<OrderDto>(FileType.OrderCsv, outputFileName, e.OrderToExport);
        var result = await mediator.Send(new ExportOrderCommand { ExportContext = context });

        if (!result.Succeeded)
        {
            MessageBox.Show($"Failed to export orders. [Error]: {result.Error}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        else
        {
            MessageBox.Show($"Saved orders to {outputFileName}.", "Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }

    private void OnShowClearOrdersConfirmation(object sender, EventArgs e)
    {
        var result = MessageBox.Show("Are you sure you want to clear all data?", "Confirmation", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        if (result == DialogResult.Yes)
        {
            _orders.Clear();
            View.DisplayData(_orders);
        }
    }

    private async Task OnShowImportOrdersView(object sender, OperationMode mode)
    {
        var importOrderPresenter = serviceProvider.GetRequiredService<ImportOrderPresenter>();

        await importOrderPresenter.InitializeAsync();
        importOrderPresenter.View.Mode = mode;

        if (importOrderPresenter.View is Form importForm)
        {
            importForm.ShowDialog();
        }
    }

    public async Task<List<OrderDto>> GetOrders()
    {
        return [.. await orderService.GetOrdersAsync()];
    }

    public void ImportData(IEnumerable<OrderDto> orders)
    {
        _orders.Clear();
        _orders.AddRange(orders);
        View.DisplayData(_orders);
        View.ShowMessage("Successfully imported data", "Success");
    }

    public void AppendData(IEnumerable<OrderDto> orders)
    {
        _orders.AddRange(orders);
        View.DisplayData(_orders);
        View.ShowMessage("Successfully appended data", "Success");
    }
}
