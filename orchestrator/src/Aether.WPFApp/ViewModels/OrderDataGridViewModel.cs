using System.Collections.ObjectModel;

using CommunityToolkit.Mvvm.ComponentModel;

using Aether.WPFApp.Contracts.ViewModels;
using Aether.WPFApp.Core.Contracts.Services;
using Aether.WPFApp.Core.Models;

namespace Aether.WPFApp.ViewModels;

public class OrderDataGridViewModel(ISampleDataService sampleDataService) : ObservableObject, INavigationAware
{
    public ObservableCollection<SampleOrder> Source { get; } = [];

    public async void OnNavigatedTo(object parameter)
    {
        Source.Clear();

        // Replace this with your actual data
        var data = await sampleDataService.GetGridDataAsync();

        foreach (var item in data)
        {
            Source.Add(item);
        }
    }

    public void OnNavigatedFrom()
    {
    }
}
