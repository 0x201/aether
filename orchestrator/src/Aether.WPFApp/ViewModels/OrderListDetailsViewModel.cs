using System.Collections.ObjectModel;

using CommunityToolkit.Mvvm.ComponentModel;

using Aether.WPFApp.Contracts.ViewModels;
using Aether.WPFApp.Core.Contracts.Services;
using Aether.WPFApp.Core.Models;

namespace Aether.WPFApp.ViewModels;

public class OrderListDetailsViewModel : ObservableObject, INavigationAware
{
    private readonly ISampleDataService _sampleDataService;
    private SampleOrder _selected;

    public SampleOrder Selected
    {
        get { return _selected; }
        set { SetProperty(ref _selected, value); }
    }

    public ObservableCollection<SampleOrder> SampleItems { get; private set; } = [];

    public OrderListDetailsViewModel(ISampleDataService sampleDataService)
    {
        _sampleDataService = sampleDataService;
    }

    public async void OnNavigatedTo(object parameter)
    {
        SampleItems.Clear();

        var data = await _sampleDataService.GetListDetailsDataAsync();

        foreach (var item in data)
        {
            SampleItems.Add(item);
        }

        Selected = SampleItems.First();
    }

    public void OnNavigatedFrom()
    {
    }
}
