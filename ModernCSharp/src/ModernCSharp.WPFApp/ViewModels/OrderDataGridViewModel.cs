using System.Collections.ObjectModel;

using CommunityToolkit.Mvvm.ComponentModel;

using ModernCSharp.WPFApp.Contracts.ViewModels;
using ModernCSharp.WPFApp.Core.Contracts.Services;
using ModernCSharp.WPFApp.Core.Models;

namespace ModernCSharp.WPFApp.ViewModels;

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
