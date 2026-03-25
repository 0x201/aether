using ModernCSharp.WPFApp.Core.Models;

namespace ModernCSharp.WPFApp.Core.Contracts.Services;

public interface ISampleDataService
{
    Task<IEnumerable<SampleOrder>> GetGridDataAsync();

    Task<IEnumerable<SampleOrder>> GetListDetailsDataAsync();
}
