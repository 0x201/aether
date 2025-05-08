using ModernCSharp.ApplicationCore.Enums;
using ModernCSharp.ApplicationCore.Models.FileExport;
using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.Infrastructure.Services.FileExport.Commands;

internal class OrderJsonExportContext(FileType fileType, string outputPath, List<Order> ordersToExport) : FileExportContext<Order>(fileType, outputPath, ordersToExport);
