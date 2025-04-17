using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.Domain.Entities;

namespace ModernCSharp.Infrastructure.Services.FileExport.Commands;

internal class OrderExcelExportContext(FileType fileType, string outputPath, List<Order> ordersToExport) : FileExportContext<Order>(fileType, outputPath, ordersToExport);
