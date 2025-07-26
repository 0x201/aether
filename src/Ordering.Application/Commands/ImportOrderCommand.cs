using ModernCSharp.Shared.FileServices.Abstraction;

using Order = ModernCSharp.Ordering.Application.Queries.Order;
namespace ModernCSharp.Ordering.Application.Commands;

public class ImportOrderCommand : IRequest<ImportResult<Order>>
{
    public IFileImportContext ImportContext { get; set; }
}
