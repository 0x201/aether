using System.ComponentModel;

using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.WinFormsApp.Enums;
using ModernCSharp.WinFormsApp.Models;

namespace ModernCSharp.WinFormsApp.Views;

public partial class OrderListView : BaseView, IOrderListView
{
    public string ExportFilePath
    {
        get;
        set;
    }

    public event AsyncEventHandler<OperationMode> ShowImportOrdersView;
    public event AsyncEventHandler<ExportOrdersEventArgs> ExportOrders;
    public event EventHandler ShowClearOrdersConfirmation;

    public OrderListView()
    {
        InitializeComponent();
    }

    private async void ImportOrdersButton_Click(object sender, EventArgs e)
    {
        ImportButton.Enabled = false;

        try
        {
            await ShowImportOrdersView?.Invoke(this, OperationMode.Import);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"An error occurred while importing orders: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            ImportButton.Enabled = true;
        }
    }

    public void DisplayData(IEnumerable<Order> orders)
    {
        OrderDataGridView.DataSource = new BindingList<Order>([.. orders]);
    }

    private async void AppendButton_Click(object sender, EventArgs e)
    {
        AppendButton.Enabled = false;

        try
        {
            await ShowImportOrdersView?.Invoke(this, OperationMode.Append);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"An error occurred while appending orders: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            AppendButton.Enabled = true;
        }
    }

    private void ClearButton_Click(object sender, EventArgs e)
    {
        ShowClearOrdersConfirmation?.Invoke(this, EventArgs.Empty);
    }

    private async void ExportButton_Click(object sender, EventArgs e)
    {
        ExportButton.Enabled = false;

        try
        {
            List<Order> ordersToExport = [];

            if (OrderDataGridView is not null)
            {
                foreach (DataGridViewRow row in OrderDataGridView.SelectedRows)
                {
                    var order = new Order
                    {
                        Id = (int)row.Cells["Id"].Value,
                        Quantity = (int)row.Cells["Quantity"].Value,
                        OrderStatus = (OrderStatus)row.Cells["OrderStatus"].Value,
                        Total = (decimal)row.Cells["Total"].Value,
                    };

                    ordersToExport.Add(order);
                }
            }

            var folderBrowserDialog = new FolderBrowserDialog
            {
                RootFolder = Environment.SpecialFolder.MyComputer,
            };

            if (folderBrowserDialog.ShowDialog() == DialogResult.OK)
            {
                ExportFilePath = folderBrowserDialog.SelectedPath;
                var exportArgs = new ExportOrdersEventArgs
                {
                    ExportFilePath = ExportFilePath,
                    OrderToExport = ordersToExport
                };
                await ExportOrders?.Invoke(this, exportArgs);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"An error occurred while exporting orders: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            ExportButton.Enabled = true;
        }
    }
}
