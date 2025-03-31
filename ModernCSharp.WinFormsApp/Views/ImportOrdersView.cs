using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Presenters;

using System.ComponentModel;

namespace ModernCSharp.WinFormsApp.Views;

public partial class ImportOrdersView : Form, IView<ImportOrderPresenter>
{
    public event Action ImportCompleted;

    private readonly OrdersListPresenter _ordersListPresenter;

    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public ImportOrderPresenter Presenter { get; set; }

    public ImportOrdersView()
    {
        InitializeComponent();
    }

    public ImportOrdersView(
        ImportOrderPresenter importOrderPresenter,
        OrdersListPresenter ordersListPresenter) : this()
    {
        Presenter = importOrderPresenter;
        _ordersListPresenter = ordersListPresenter;
    }

    public virtual void OnImportCompleted()
    {
        ImportCompleted?.Invoke();
    }


    private void ImportOrdersForm_Load(object sender, EventArgs e)
    {

    }

    private void OpenOrderFilesButton_Click(object sender, EventArgs e)
    {
        var result = openOrderFilesDialog.ShowDialog();

        if (result == DialogResult.OK)
        {
            var filePath = openOrderFilesDialog.FileName;

            OrderFilePathTextBox.Text = filePath;
        }
    }

    private async void ImportOrderButton_Click(object sender, EventArgs e)
    {
        var filePath = OrderFilePathTextBox.Text;
        var result = await Presenter.Import(filePath);

        if (result.IsSuccess)
        {
            MessageBox.Show("Successfully imported orders");
            OnImportCompleted();
        }
    }
}