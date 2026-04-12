namespace Aether.Ordering.Application.Services;

public class OrderExcelExportStrategy(ILogger<OrderExcelExportStrategy> logger) 
    : BaseOrderFileExportStrategy<OrderDto>(logger, FileType.OrderExcel)
{
    protected override Task PerformExportAsync(IFileExportContext<OrderDto> context, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Worksheet 1");

        var headerRow = ws.Row(1);
        var properties = typeof(OrderDto).GetProperties();

        var headerCellIndex = 1;
        foreach (var property in properties)
        {
            headerRow.Cell(headerCellIndex).SetValue(property.Name);
            headerCellIndex++;
        }

        var contentRowIndex = 2;
        foreach (var order in context.DataToExport)
        {
            var currentRow = ws.Row(contentRowIndex);
            currentRow.Cell("A").SetValue(order.ordernumber);
            currentRow.Cell("B").SetValue(order.status);
            currentRow.Cell("C").SetValue(order.quantity);
            currentRow.Cell("D").SetValue(order.total);
            currentRow.Cell("E").SetValue(order.date);
            currentRow.Cell("F").SetValue(order.username);

            contentRowIndex++;
        }

        wb.SaveAs(context.OutputPath);

        return Task.CompletedTask;
    }
}
