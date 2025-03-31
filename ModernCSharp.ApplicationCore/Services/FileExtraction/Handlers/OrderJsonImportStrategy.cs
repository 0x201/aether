using System.Text.Json;

using Microsoft.Extensions.Logging;

using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Constants;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models;
using ModernCSharp.ApplicationCore.Models.FileExtraction;
using ModernCSharp.ApplicationCore.Services.FileExtraction.Commands;

namespace ModernCSharp.ApplicationCore.Services.FileExtraction.Handlers;

public class OrderJsonImportStrategy(ILogger<OrderJsonImportStrategy> logger) : IFileImportStrategy<Order>
{
    private OrderJsonImportContext _context;
    public List<FileType> FileTypes => [FileType.OrderJson];

    public void InitializeContext(IFileImportContext context)
    {
        if (context is OrderJsonImportContext importContext)
        {
            _context = importContext;
        }
        else
        {
            throw new ArgumentException("Invalid file import context");
        }
    }

    public async Task<ImportResult<Order>> ImportAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            var orders = await PerformImportAsync(_context, cancellationToken);
            return ImportResult<Order>.Success(orders);
        }
        catch (OperationCanceledException)
        {
            logger.LogError("Import {FileType} operation  was cancelled.", _context.FileType);
            return ImportResult<Order>.Failure(new("", $"Import {_context.FileType} operation  was cancelled."));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while importing orders from {@InputPath}.", _context.InputPath);
            return ImportResult<Order>.Failure(new("", $"An error occurred while importing orders from {_context.InputPath}."));
        }
    }

    private async Task<List<Order>> PerformImportAsync(OrderJsonImportContext context, CancellationToken cancellationToken = default)
    {
        using var stream = new FileStream(context.InputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var orderWrapper = await JsonSerializer.DeserializeAsync<JsonWrapper<Order>>(stream, JsonSerializationConstants.DefaultOptions, cancellationToken);

        return orderWrapper.Items;
    }
}
