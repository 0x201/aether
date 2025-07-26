using Order = ModernCSharp.Ordering.Application.Queries.Order;

namespace ModernCSharp.WinUIApp.ViewModels;

public partial class ImportOrdersViewModel(
    IMediator mediator) : ObservableRecipient
{
    [ObservableProperty] public double currentProgress = 0;
    [ObservableProperty] private FileType selectedFileType = FileType.OrderJson;
    [ObservableProperty] private string filePath;
    [ObservableProperty] private Visibility progressBarVisibility = Visibility.Collapsed;
    [ObservableProperty] private string importResult;

    public ObservableCollection<Order> Orders
    {
        get;
        private set;
    } = [];

    [RelayCommand]
    private async Task ImportAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        Orders.Clear();
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
        ProgressBarVisibility = Visibility.Visible;
        var fileImportContext = new FileImportContext(SelectedFileType, FilePath);

        for (var i = 0; i <= 100; i += 10)
        {
            await Task.Delay(300); // Delay for 300 milliseconds
            yield return i;
        }

        var result = await mediator.Send(new ImportOrderCommand { ImportContext = fileImportContext });
        if (result.Succeeded)
        {
            ImportResult = $"Successfully imported {result.Data.Count} records from {FilePath}";
            foreach (var order in result.Data)
            {
                Orders.Add(order);
            }
            yield return 100;
        }
        else
        {
            ImportResult = string.Join('\n', result.Error);
            yield return 100;
        }
        ProgressBarVisibility = Visibility.Collapsed;
    }
}
