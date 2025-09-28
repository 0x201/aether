using System.ComponentModel;

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
                                            ordernumber = (int)row.Cells[0].Value,
                                            date = (DateTime)row.Cells[1].Value,
                                            status = (string)row.Cells[2].Value,
                                            quantity = (int)row.Cells[3].Value,
                                            total = (decimal)row.Cells[4].Value,
                                            username = (string)row.Cells[5].Value,
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

            var filteredData = new BindingList<Order>(
            [
                .. Orders.Where(o =>
                    o.username.Contains(filterText, StringComparison.CurrentCultureIgnoreCase) ||
                    o.ordernumber.ToString().Contains(filterText) ||
                    o.total.ToString().Contains(filterText) ||
                    o.date.ToString().Contains(filterText)
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
