using AutoMapper;
using AutoMapper.QueryableExtensions;

using MediatR;

using Microsoft.EntityFrameworkCore;

using ModernCSharp.ApplicationCore.Common.Interfaces;
using ModernCSharp.ApplicationCore.Common.Mappings;
using ModernCSharp.ApplicationCore.Common.Models;

namespace ModernCSharp.ApplicationCore.Ordering.Queries;
public record GetOrdersWithPaginationQuery : IRequest<PaginatedList<OrderDto>>
{
    public int PageNumber
    {
        get;
        set;
    } = 1;

    public int PageSize
    {
        get;
        set;
    } = 10;
}

public class GetOrdersWithPaginationQueryHandler(
    IApplicationDbContext dbContext,
    IMapper mapper) : IRequestHandler<GetOrdersWithPaginationQuery, PaginatedList<OrderDto>>
{
    public async Task<PaginatedList<OrderDto>> Handle(GetOrdersWithPaginationQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Orders
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .ProjectTo<OrderDto>(mapper.ConfigurationProvider)
            .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
    }
}
