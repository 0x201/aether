namespace ModernCSharp.Ordering.Application.Commands;

public record ExportOrderCommand : IRequest<Result>
{
    public IFileExportContext<OrderDto> ExportContext { get; set; }
}
