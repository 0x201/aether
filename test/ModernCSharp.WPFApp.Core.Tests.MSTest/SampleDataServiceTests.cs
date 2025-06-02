using Microsoft.VisualStudio.TestTools.UnitTesting;

using ModernCSharp.WPFApp.Core.Services;

namespace ModernCSharp.WPFApp.Core.Tests.MSTest;

[TestClass]
public class SampleDataServiceTests
{
    public SampleDataServiceTests()
    {
    }

    // Remove or update this once your app is using real data and not the SampleDataService.
    // This test serves only as a demonstration of testing functionality in the Core library.
    [TestMethod]
    public async Task EnsureSampleDataServiceReturnsGridDataAsync()
    {
        var sampleDataService = new SampleDataService();

        var data = await sampleDataService.GetGridDataAsync();

        Assert.IsTrue(data.Any());
    }

    // Remove or update this once your app is using real data and not the SampleDataService.
    // This test serves only as a demonstration of testing functionality in the Core library.
    [TestMethod]
    public async Task EnsureSampleDataServiceReturnsListDetailsDataAsync()
    {
        var sampleDataService = new SampleDataService();

        var data = await sampleDataService.GetListDetailsDataAsync();

        Assert.IsTrue(data.Any());
    }
}
