using Microsoft.Extensions.DependencyInjection;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Services;
using ModernCSharp.Infrastructure.Services.FileContext;
using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Enums;
using ModernCSharp.WinFormsApp.Models;
using ModernCSharp.WinFormsApp.Views;

namespace ModernCSharp.WinFormsApp.Presenters;

public class OrdersListPresenter(
    IOrderListView view,
    IServiceProvider serviceProvider,
    IFileExportService<Order> fileExportService,
    ExportContextFactory<Order> exportContextFactory,
    OrderService orderService) : AbstractPresenter<IOrderListView>(view)
{
    private List<Order> _orders;

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

        var context = exportContextFactory.CreateContext(FileType.OrderCsv, outputFileName, e.OrderToExport);
        var result = await fileExportService.ExportAsync(context);

        if (result.IsFailure)
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

    public async Task<List<Order>> GetOrders()
    {
        return await orderService.GetOrdersAsync();
    }

    public void ImportData(IEnumerable<Order> orders)
    {
        _orders.Clear();
        _orders.AddRange(orders);
        View.DisplayData(_orders);
        View.ShowMessage("Successfully imported data", "Success");
    }

    public void AppendData(IEnumerable<Order> orders)
    {
        _orders.AddRange(orders);
        View.DisplayData(_orders);
        View.ShowMessage("Successfully appended data", "Success");
    }
}
