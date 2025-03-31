using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Utils;
using ModernCSharp.Infrastructure.Services;
using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Views;

namespace ModernCSharp.WinFormsApp.Presenters;

public class ImportOrderPresenter(IFileImportService<Order> importService,
    ImportContextFactory importContextFactory) : AbstractPresenter<ImportOrdersView, ImportOrderPresenter>
{
    public async Task<IResult> Import(string filePath)
    {
        var extension = Path.GetExtension(filePath);
        var fileType = FileIoUtils.MapToFileType(extension);
        var importContext = importContextFactory.CreateContext(fileType, filePath);
        return await importService.ImportAsync(importContext);
    }
}
