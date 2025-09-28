namespace ModernCSharp.WinFormsApp.Views;

public class BaseView : Form, IView
{
    public virtual void CloseView() => Close();
    public virtual void ShowError(string message) => MessageBox.Show(message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    public void ShowMessage(string message, string title) => MessageBox.Show(message, title, MessageBoxButtons.OK, MessageBoxIcon.Information);
    public void ShowView() => Show();
}
