using System.Text.Json;

using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Constants;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.Infrastructure.Services.FileExport.Commands;

namespace ModernCSharp.Infrastructure.Services.FileExport.Handlers;

public class OrderJsonExportStrategy(ILogger<OrderJsonExportStrategy> logger) : IFileExportStrategy<Order>
{
    private OrderJsonExportContext? _context;
    public List<FileType> FileTypes => [FileType.OrderJson];

    public void InitializeContext(IFileExportContext<Order> context)
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
            await PerformExportAsync(cancellationToken);
            return Result.Success();
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Export {FileType} operation  was cancelled.", _context!.FileType);
            return Result.Failure(new("", $"Export {_context.FileType} operation  was cancelled."));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while exporting orders to {@OutputPath}.", _context!.OutputPath);
            return Result.Failure(new("", $"An error occurred while generating order json file."));
        }
    }

    private async Task PerformExportAsync(CancellationToken cancellationToken = default)
    {
        if (_context!.DataToExport.Count == 0)
        {
            logger.LogInformation("No order to export.");
            return;
        }

        var orderWrapper = new JsonWrapper<Order>(_context.DataToExport);
        using var stream = new FileStream(_context.OutputPath, FileMode.Create, FileAccess.Write, FileShare.Read);
        await JsonSerializer.SerializeAsync(stream, orderWrapper, JsonSerializationConstants.DefaultOptions, cancellationToken);
        await stream.FlushAsync(cancellationToken);
    }
}