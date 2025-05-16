namespace ModernCSharp.Ordering.Infrastructure.Services.FileExport.Commands;

public class OrderJsonExportContext(FileType fileType, string outputPath, List<Order> ordersToExport) : FileExportContext<Order>(fileType, outputPath, ordersToExport);
