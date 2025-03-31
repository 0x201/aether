using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.ApplicationCore.Services.FileExtraction;

namespace ModernCSharp.WinUIApp.ViewModels;

public partial class BlankViewModel(IFileImportService<Order> fileImportService) : ObservableRecipient
{
    [ObservableProperty]
    public double currentProgress = 0;

    [ObservableProperty]
    private FileType selectedFileType = FileType.OrderJson;

    [ObservableProperty]
    private string filePath;

    [ObservableProperty]
    private bool progressBarVisibility;

    [ObservableProperty]
    private string importResult;

    [RelayCommand]
    private async Task ImportAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        try
        {
            await foreach (var progress in ImportCoreAsync())
            {
                CurrentProgress = progress;
            }
        }
        catch (Exception)
        {

            throw;
        }
    }

    private async IAsyncEnumerable<int> ImportCoreAsync()
    {
        var totalItems = 100;
        for (var i = 1; i <= totalItems; i++)
        {
            ProgressBarVisibility = true;
            var fileImportContext = FileImportContext.Create(SelectedFileType, FilePath);
            var result = await fileImportService.ImportAsync(fileImportContext);
            if (result.IsSuccess)
            {
                yield return (i * 100) / totalItems;
                ImportResult = $"Successfully imported {result.Data.Count} records from {FilePath}";
                ProgressBarVisibility = false;
            }
        }
    }
}
