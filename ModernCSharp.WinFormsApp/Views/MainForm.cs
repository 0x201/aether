using ModernCSharp.WinFormsApp.Models;

namespace ModernCSharp.WinFormsApp.Views;

public partial class MainForm : BaseView, IMainView
{
    public event AsyncEventHandler ShowOrdersForm;

    public MainForm()
    {
        InitializeComponent();
    }

    private void OrderListToolStripMenuItem1_Click(object sender, EventArgs e)
    {
        ShowOrdersForm?.Invoke(this, EventArgs.Empty);
    }
}
