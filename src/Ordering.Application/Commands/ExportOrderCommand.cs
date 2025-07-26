using ModernCSharp.Shared.FileServices.Abstraction;

using Order = ModernCSharp.Ordering.Application.Queries.Order;


namespace ModernCSharp.Ordering.Application.Commands;

public record ExportOrderCommand : IRequest<Result>
{
    public IFileExportContext<Order> ExportContext { get; set; }
}
