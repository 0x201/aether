namespace Aether.Ordering.Application.Commands;

public class ImportOrderCommand : IRequest<ImportResult<OrderDto>>
{
    public IFileImportContext ImportContext { get; set; }
}
