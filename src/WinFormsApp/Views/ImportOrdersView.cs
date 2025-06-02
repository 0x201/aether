using ModernCSharp.WinFormsApp.Enums;
using ModernCSharp.WinFormsApp.Models;

namespace ModernCSharp.WinFormsApp.Views;

public partial class ImportOrdersView : BaseView, IImportView
{
    public event AsyncEventHandler<OperationMode> ImportRequested;
    public OperationMode Mode
    {
        get;
        set;
    }

    public string FilePath
    {
        get;
        set;
    }

    public ImportOrdersView()
    {
        InitializeComponent();
    }

    private void OpenOrderFilesButton_Click(object sender, EventArgs e)
    {
        var openFileDialog = new OpenFileDialog()
        {
            Filter = "CSV Files (*.csv)|*.csv|All Files (*.*)|*.*",
            Title = "Select a CSV File"
        };
        if (openFileDialog.ShowDialog() == DialogResult.OK)
        {
            OrderFilePathTextBox.Text = openFileDialog.FileName;
            FilePath = openFileDialog.FileName;
        }
    }

    private async void ImportOrderButton_Click(object sender, EventArgs e)
    {
        await ImportRequested?.Invoke(this, Mode);
    }

    public override void CloseView()
    {
        DialogResult = DialogResult.OK;
        base.CloseView();
    }

    private void CloseButton_Click(object sender, EventArgs e)
    {
        CloseView();
    }
}