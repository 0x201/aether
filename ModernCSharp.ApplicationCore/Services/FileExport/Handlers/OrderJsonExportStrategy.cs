using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Constants;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.ApplicationCore.Services.FileExport.Commands;
using System.Text.Json;

namespace ModernCSharp.ApplicationCore.Services.FileExport.Handlers;

public class OrderJsonExportStrategy(ILogger<OrderJsonExportStrategy> logger, OrderService orderService) : IFileExportStrategy
{
    private OrderJsonExportContext _context;
    public List<FileType> FileTypes => [FileType.OrderJson];

    public void InitializeContext(IFileExportContext context)
    {
        if (context is OrderJsonExportContext exportContext)
        {
            _context = exportContext;
        }
        else
        {
            throw new ArgumentException("Invalid file export context");
        }
    }
    public async Task<IResult> ExportAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            await PerformExportAsync(_context, cancellationToken);
            return Result.Success();
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Export {FileType} operation  was cancelled.", _context.FileType);
            return Result.Failure(new("", $"Export {_context.FileType} operation  was cancelled."));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while exporting orders to {@OutputPath}.", _context.OutputPath);
            return Result.Failure(new("", $"An error occurred while generating order json file."));
        }
    }
    private async Task PerformExportAsync(OrderJsonExportContext context, CancellationToken cancellationToken = default)
    {
        var orders = await orderService.GetOrdersAsync(cancellationToken);

        if (orders.Count == 0)
        {
            logger.LogInformation("No order to export.");
            return;
        }

        var orderWrapper = new JsonWrapper<Order>(orders);
        using var stream = new FileStream(context.OutputPath, FileMode.Create, FileAccess.Write, FileShare.Read);
        await JsonSerializer.SerializeAsync(stream, orderWrapper, JsonSerializationConstants.DefaultOptions, cancellationToken);
        await stream.FlushAsync(cancellationToken);
    }
}