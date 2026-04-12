

using Windows.Storage.Pickers;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace Aether.WinUIApp.Controls;

public sealed partial class ImportOrdersDialog : UserControl
{
    public ImportOrdersViewModel ViewModel
    {
        get;
    }

    public ImportOrdersDialog()
    {
        ViewModel = App.GetService<ImportOrdersViewModel>();
        InitializeComponent();
    }

    private async void OpenOrderFileButton_Click(object sender, RoutedEventArgs e)
    {
        var orderFilePicker = new FileOpenPicker()
        {
            ViewMode = PickerViewMode.Thumbnail,
            SuggestedStartLocation = PickerLocationId.Desktop,
        };
        var window = App.MainWindow;
        var hWnd = WinRT.Interop.WindowNative.GetWindowHandle(window);
        WinRT.Interop.InitializeWithWindow.Initialize(orderFilePicker, hWnd);

        var fileExtension = MapFileType(ViewModel.SelectedFileType);
        orderFilePicker.FileTypeFilter.Add(fileExtension);

        var selectedOrderFile = await orderFilePicker.PickSingleFileAsync();

        if (selectedOrderFile is not null)
        {
            ViewModel.FilePath = selectedOrderFile.Path;
        }
        else
        {
            ViewModel.FilePath = string.Empty;
            OrderFilePathTextBlock.Text = "Operation cancelled.";
        }
    }

    private static string MapFileType(FileType fileType)
    {
        return fileType switch
        {
            FileType.OrderJson => ".json",
            FileType.OrderCsv => ".csv",
            FileType.OrderExcel => ".xlsx",
            _ => throw new NotSupportedException("Unsupported file type")
        };
    }
}
