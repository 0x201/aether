using MediatR;

using Microsoft.Extensions.DependencyInjection;

using ModernCSharp.Ordering.Application.Commands;
using ModernCSharp.Ordering.Application.Queries;
using ModernCSharp.Shared.FileServices;
using ModernCSharp.Shared.FileServices.Import;
using ModernCSharp.Shared.Utils;
using ModernCSharp.WinFormsApp.Common;
using ModernCSharp.WinFormsApp.Enums;
using ModernCSharp.WinFormsApp.Views;

namespace ModernCSharp.WinFormsApp.Presenters;

public class ImportOrderPresenter(
    IImportView view,
    IMediator mediator,
    IServiceProvider serviceProvider) : AbstractPresenter<IImportView>(view)
{
    public async override Task InitializeAsync()
    {
        View.ImportRequested += OnImportRequested;

        await base.InitializeAsync();
    }

    private async Task OnImportRequested(object sender, OperationMode e)
    {
        try
        {
            if (string.IsNullOrEmpty(View.FilePath))
            {
                View.ShowError("");
                return;
            }

            var importedResult = await Import(View.FilePath);

            if (!importedResult.Succeeded)
            {
                View.ShowError($"Failed to import orders from {View.FilePath}. [Error]: {importedResult.Error}");
            }

            var ordersListPresenter = serviceProvider.GetRequiredService<OrdersListPresenter>();

            if (View.Mode == OperationMode.Import)
            {
                ordersListPresenter.ImportData(importedResult.Data);
            }
            else
            {
                ordersListPresenter.AppendData(importedResult.Data);
            }

        }
        catch (Exception ex)
        {
            View.ShowError($"An error occurred while importing orders. Error message: {ex.Message}");
        }
    }

    private async Task<ImportResult<Order>> Import(string filePath)
    {
        var extension = Path.GetExtension(filePath);
        var fileType = FileIoUtils.MapToFileType(extension);
        var importContext = new FileImportContext(fileType, filePath);
        return await mediator.Send(new ImportOrderCommand { ImportContext = importContext });
    }


}
