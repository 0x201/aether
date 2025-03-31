using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.WinUIApp.ViewModels;

using Windows.Storage.Pickers;

namespace ModernCSharp.WinUIApp.Views;

public sealed partial class BlankPage : Page
{
    public BlankViewModel ViewModel
    {
        get;
    }

    public BlankPage()
    {
        ViewModel = App.GetService<BlankViewModel>();
        InitializeComponent();
    }

    private async void OpenOrderFileButton_Click(object sender, RoutedEventArgs e)
    {
        var orderFilePicker = new FileOpenPicker()
        {
            ViewMode = PickerViewMode.Thumbnail,
            SuggestedStartLocation = PickerLocationId.DocumentsLibrary,
        };

        var window = App.MainWindow;
        var hWnd = WinRT.Interop.WindowNative.GetWindowHandle(window);
        WinRT.Interop.InitializeWithWindow.Initialize(orderFilePicker, hWnd);

        var fileExtension = MapFileType(ViewModel.SelectedFileType);
        orderFilePicker.FileTypeFilter.Add(fileExtension);

        //orderFilePicker.FileTypeFilter.Add(".csv");
        //orderFilePicker.FileTypeFilter.Add(".json");
        //orderFilePicker.FileTypeFilter.Add(".xlsx");

        var selectedOrderFile = await orderFilePicker.PickSingleFileAsync();

        if (selectedOrderFile is not null)
        {
            OrderFilePathTextBlock.Text = $"Order file path: {selectedOrderFile.Name}";
            ViewModel.FilePath = selectedOrderFile.Path;
        }
        else
        {
            OrderFilePathTextBlock.Text = "Operation cancelled.";
        }
    }

    private string MapFileType(FileType fileType)
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
