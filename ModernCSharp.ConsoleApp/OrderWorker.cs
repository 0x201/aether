using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using ModernCSharp.Application.Enums;
using ModernCSharp.Application.Models;
using ModernCSharp.Application.Models.FileExport;
using ModernCSharp.Application.Models.FileExtraction;
using ModernCSharp.Application.Services;
using ModernCSharp.Application.Services.FileExport;
using ModernCSharp.Application.Services.FileExtraction;

namespace ModernCSharp.ConsoleApp;

public class OrderWorker(ILogger<OrderWorker> logger
    , IFileExportService fileExportService
    , OrderService orderService
    , IFileImportService<Order> fileImportService) : BackgroundService
{
    private int _exitCode = 0;

    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var result = await ImportAsync(stoppingToken);

            if (result)
            {
                result = await ExportAsync(stoppingToken);
            }

            if (!result)
            {
                _exitCode = 1;
            }
        }
        catch (Exception ex)
        {
            _exitCode = 500;
            logger.LogError(ex, "An error occurred: {@Message}", ex.Message);
            throw;
        }
        finally
        {
            Environment.Exit(_exitCode);
        }
    }

    private async Task<bool> ExportAsync(CancellationToken cancellationToken = default)
    {
        List<(FileType Type, string Path)> exportTasks = [
            (FileType.OrderCsv, "D:\\orders.csv"),
            (FileType.OrderJson, "D:\\orders.json"),
            (FileType.OrderExcel, "D:\\orders.xlsx")
        ];
        IResult result = null;
        cancellationToken.ThrowIfCancellationRequested();
        foreach (var (fileType, filePath) in exportTasks)
        {
            var exportContext = FileExportContext.Create(fileType, filePath);

            result = await fileExportService.ExportAsync(exportContext);

            if (result.IsFailure)
            {
                logger.LogError("Failed to export {FileType} file to {FilePath}: {@Error}",
                    fileType, filePath, result.Error);
                break;
            }
            logger.LogInformation("Successfully exported records to {InputPath}", filePath);
        }

        if (result?.IsSuccess ?? false)
        {
            logger.LogInformation("Total exported files: {TotalRecords}", exportTasks.Count);
        }

        return result?.IsSuccess ?? false;
    }

    private async Task<bool> ImportAsync(CancellationToken cancellationToken = default)
    {
        List<(FileType Type, string Path)> importTasks = [
            (FileType.OrderCsv, "D:\\additional orders.csv"),
            (FileType.OrderJson, "D:\\additional orders.json"),
            (FileType.OrderExcel, "D:\\additional orders.xlsx")
        ];

        ImportResult<Order> result = null;
        var totalOrderRecords = 0;
        cancellationToken.ThrowIfCancellationRequested();

        foreach (var (fileType, filePath) in importTasks)
        {
            var importContext = FileImportContext.Create(fileType, filePath);

            result = await fileImportService.ImportAsync(importContext);

            if (result.IsFailure)
            {
                logger.LogError("Failed to import {FileType} file at {FilePath}: {@Error}",
                    fileType, filePath, result.Error);
                break;
            }

            await orderService.InsertManyAsync(result.Data);
            totalOrderRecords += result.Data.Count;
            logger.LogInformation("Successfully imported {RecordCount} records from {InputPath}", result.Data.Count, filePath);
        }

        if (result?.IsSuccess ?? false)
        {
            logger.LogInformation("Total imported records: {TotalRecords}", totalOrderRecords);
        }

        return result?.IsSuccess ?? false;
    }
}
