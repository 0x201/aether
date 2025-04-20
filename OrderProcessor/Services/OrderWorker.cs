using Microsoft.Extensions.Options;
using ModernCSharp.ApplicationCore.Abstractions;
using ModernCSharp.ApplicationCore.Common.Models;
using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Services;
using ModernCSharp.Domain.Entities;
using ModernCSharp.EventBus.Abstractions;
using ModernCSharp.Infrastructure.Services.FileContext;

namespace ModernCSharp.OrderProcessor.Services;

public class OrderWorker(
    ILogger<OrderWorker> logger,
    IEventBus eventBus,
    IOptions<BackgroundTaskOptions> options,
    IFileExportService<Order> fileExportService,
    IFileImportService<Order> fileImportService,
    ExportContextFactory<Order> exportContextFactory,
    ImportContextFactory importContextFactory,
    OrderService orderService) : BackgroundService
{
    private readonly BackgroundTaskOptions
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));

    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var delayTime = TimeSpan.FromSeconds(_options.CheckUpdateTime);

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("GracePeriodManagerService is starting.");
            stoppingToken.Register(() => logger.LogDebug("GracePeriodManagerService background task is stopping."));
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("GracePeriodManagerService background task is doing background work.");
            }

            await CheckConfirmedGracePeriodOrders();

            await Task.Delay(delayTime, stoppingToken);
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("GracePeriodManagerService background task is stopping.");
        }
    }

    private async Task CheckConfirmedGracePeriodOrders()
    {
        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Checking confirmed grace period orders");
        }

        var orderIds = await GetConfirmedGracePeriodOrders();

        foreach (var orderId in orderIds)
        {
            var confirmGracePeriodEvent = new GracePeriodConfirmedIntegrationEvent(orderId);

            logger.LogInformation("Publishing integration event: {IntegrationEventId} - ({@IntegrationEvent})",
                confirmGracePeriodEvent.Id, confirmGracePeriodEvent);

            await eventBus.PublishAsync(confirmGracePeriodEvent);
        }
    }

    private async ValueTask<List<int>> GetConfirmedGracePeriodOrders()
    {
        try
        {
            using var conn = dataSource.CreateConnection();
            using var command = conn.CreateCommand();
            command.CommandText = """
                                  SELECT "Id"
                                  FROM ordering.orders
                                  WHERE CURRENT_TIMESTAMP - "OrderDate" >= @GracePeriodTime AND "OrderStatus" = 'Submitted'
                                  """;
            command.Parameters.AddWithValue("GracePeriodTime", TimeSpan.FromMinutes(_options.GracePeriodTime));

            List<int> ids = [];

            await conn.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ids.Add(reader.GetInt32(0));
            }

            return ids;
        }
        catch (NpgsqlException exception)
        {
            logger.LogError(exception, "Fatal error establishing database connection");
        }

        return [];
    }

    private async Task<bool> ExportAsync(CancellationToken cancellationToken = default)
    {
        var ordersToExport = await orderService.GetOrdersAsync(cancellationToken);

        List<(FileType Type, string Path, List<Order> OrdersToExport)> exportTasks =
        [
            (FileType.OrderCsv, "D:\\orders.csv", ordersToExport),
            (FileType.OrderJson, "D:\\orders.json", ordersToExport),
            (FileType.OrderExcel, "D:\\orders.xlsx", ordersToExport)
        ];
        Result result = null;
        cancellationToken.ThrowIfCancellationRequested();
        foreach (var (fileType, filePath, orders) in exportTasks)
        {
            var exportContext = exportContextFactory.CreateContext(fileType, filePath, orders);

            result = await fileExportService.ExportAsync(exportContext, cancellationToken);

            if (!result.Succeeded)
            {
                logger.LogError("Failed to export {FileType} file to {FilePath}: {@Error}",
                    fileType, filePath, result.Error);
                break;
            }

            logger.LogInformation("Successfully exported records to {InputPath}", filePath);
        }

        if (result?.Succeeded ?? false)
        {
            logger.LogInformation("Total exported files: {TotalRecords}", exportTasks.Count);
        }

        return result?.Succeeded ?? false;
    }

    private async Task<bool> ImportAsync(CancellationToken cancellationToken = default)
    {
        List<(FileType Type, string Path)> importTasks =
        [
            (FileType.OrderCsv, "D:\\additional orders.csv"),
            (FileType.OrderJson, "D:\\additional orders.json"),
            (FileType.OrderExcel, "D:\\additional orders.xlsx")
        ];

        ImportResult<Order> result = null;
        var totalOrderRecords = 0;
        cancellationToken.ThrowIfCancellationRequested();

        foreach (var (fileType, filePath) in importTasks)
        {
            var importContext = importContextFactory.CreateContext(fileType, filePath);

            result = await fileImportService.ImportAsync(importContext, cancellationToken);

            if (!result.Succeeded)
            {
                logger.LogError("Failed to import {FileType} file from {FilePath}: {@Error}",
                    fileType, filePath, result.Error);
                break;
            }

            await orderService.InsertManyAsync(result.Data);
            totalOrderRecords += result.Data.Count;
            logger.LogInformation("Successfully imported {RecordCount} records from {InputPath}", result.Data.Count,
                filePath);
        }

        if (result?.Succeeded ?? false)
        {
            logger.LogInformation("Total imported records: {TotalRecords}", totalOrderRecords);
        }

        return result?.Succeeded ?? false;
    }
}