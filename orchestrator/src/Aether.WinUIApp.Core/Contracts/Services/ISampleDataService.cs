using Aether.WinUIApp.Core.Models;

namespace Aether.WinUIApp.Core.Contracts.Services;

// Remove this class once your pages/features are using your data.
public interface ISampleDataService
{
    Task<IEnumerable<SampleOrder>> GetGridDataAsync();

    Task<IEnumerable<SampleOrder>> GetListDetailsDataAsync();

    Task AddAsync(SampleOrder orderToAdd);
}
