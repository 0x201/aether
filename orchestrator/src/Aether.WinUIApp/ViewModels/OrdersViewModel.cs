namespace Aether.WinUIApp.ViewModels;

public partial class OrdersViewModel(IOrderQueries orderService) : ObservableRecipient, INavigationAware
{
    [ObservableProperty] private ObservableCollection<OrderDto> _orders = [];
    [ObservableProperty] private OrderDto _selectedOrder;

    [RelayCommand]
    private async Task OpenImportDialogAsync(XamlRoot xamlRoot)
    {
        var dialog = new ImportOrdersDialog();
        var contentDialog = new ContentDialog
        {
            Title = "Import Orders",
            Content = dialog,
            PrimaryButtonText = "Save",
            SecondaryButtonText = "Close",
            DefaultButton = ContentDialogButton.Primary,
            XamlRoot = xamlRoot
        };

        var result = await contentDialog.ShowAsync();

        if (result == ContentDialogResult.Primary)
        {
            if (dialog.ViewModel.Orders.Count > 0)
            {
                foreach (var order in dialog.ViewModel.Orders)
                {
                    Orders.Add(order);
                }
            }
        }
    }


    public void OnNavigatedFrom()
    {

    }

    public async void OnNavigatedTo(object parameter)
    {
        var orders = await orderService.GetOrdersAsync();
        foreach (var order in orders)
        {
            Orders.Add(order);
        }
    }
}
