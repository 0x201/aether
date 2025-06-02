namespace ModernCSharp.Ordering.Infrastructure.Services.FileExport.Commands;

public class OrderCsvExportContext(FileType fileType, string outputPath, IEnumerable<Order> ordersToExport) : FileExportContext<Order>(fileType, outputPath, ordersToExport);
