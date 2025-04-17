using System.ComponentModel;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.WinFormsApp.Enums;
using ModernCSharp.WinFormsApp.Models;

namespace ModernCSharp.WinFormsApp.Views;

public partial class OrderListView : BaseView, IOrderListView
{
    public BindingList<Order> Orders
    {
        get;
        set;
    } = [];

    public string ExportFilePath
    {
        get;
        set;
    }

    public event AsyncEventHandler<OperationMode> ShowImportOrdersView;
    public event AsyncEventHandler<ExportOrdersEventArgs> ExportOrders;
    public event EventHandler ShowClearOrdersConfirmation;

    private readonly BindingSource _bindingSource = [];

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
            MessageBox.Show($"An error occurred while importing orders: {ex.Message}", "Error", MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            ImportButton.Enabled = true;
        }
    }

    public void DisplayData(IEnumerable<Order> orders)
    {
        Orders = [.. orders];
        _bindingSource.DataSource = Orders;
        OrderDataGridView.DataSource = _bindingSource;
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
            MessageBox.Show($"An error occurred while appending orders: {ex.Message}", "Error", MessageBoxButtons.OK,
                MessageBoxIcon.Error);
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
                ordersToExport.AddRange(from DataGridViewRow row in OrderDataGridView.SelectedRows
                    select new Order
                    {
                        Id = (int)row.Cells["Id"].Value,
                        Quantity = (int)row.Cells["Quantity"].Value,
                        OrderStatus = (OrderStatus)row.Cells["OrderStatus"].Value,
                        Total = (decimal)row.Cells["Total"].Value,
                    });
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
            MessageBox.Show($"An error occurred while exporting orders: {ex.Message}", "Error", MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            ExportButton.Enabled = true;
        }
    }

    private void OrderDataGridView_ColumnHeaderMouseClick(object sender, DataGridViewCellMouseEventArgs e)
    {
        var column = OrderDataGridView.Columns[e.ColumnIndex];
        var direction = GetNextSortDirection(column);

        ApplySort(column.DataPropertyName, direction);
    }

    #region Sort

    private ListSortDirection GetNextSortDirection(DataGridViewColumn column)
    {
        if (OrderDataGridView.SortedColumn == column)
        {
            return OrderDataGridView.SortOrder == SortOrder.Ascending
                ? ListSortDirection.Descending
                : ListSortDirection.Ascending;
        }

        return ListSortDirection.Ascending;
    }

    private void ApplySort(string propertyName, ListSortDirection direction)
    {
        _bindingSource.Sort = $"{propertyName} {(direction == ListSortDirection.Ascending ? "ASC" : "DESC")}";

        if (_bindingSource.DataSource is List<Order> list)
        {
            var sortedList = direction == ListSortDirection.Ascending
                ? list.OrderBy(x => GetPropertyValue(x, propertyName)).ToList()
                : list.OrderByDescending(x => GetPropertyValue(x, propertyName)).ToList();

            _bindingSource.DataSource = sortedList;
        }
    }

    private object GetPropertyValue(Order order, string propertyName)
    {
        return order.GetType().GetProperty(propertyName)?.GetValue(order, null);
    }

    #endregion

    #region Filter

    private void FilterTextBox_TextChanged(object sender, EventArgs e)
    {
        if (string.IsNullOrEmpty(FilterTextBox.Text))
        {
            _bindingSource.DataSource = Orders;
        }
        else
        {
            var filterText = FilterTextBox.Text.ToLower();

            // 对 BindingList 进行过滤
            var filteredData = new BindingList<Order>(
            [
                .. Orders.Where(o =>
                    o.CustomerName.Contains(filterText, StringComparison.CurrentCultureIgnoreCase) ||
                    o.Id.ToString().Contains(filterText) ||
                    o.Total.ToString().Contains(filterText) ||
                    o.OrderDate.ToString().Contains(filterText)
                )
            ]);

            _bindingSource.DataSource = filteredData;
        }

        if (OrderDataGridView.SortedColumn != null)
        {
            ApplySort(
                OrderDataGridView.SortedColumn.DataPropertyName,
                OrderDataGridView.SortOrder == SortOrder.Ascending
                    ? ListSortDirection.Ascending
                    : ListSortDirection.Descending);
        }
    }

    #endregion
}