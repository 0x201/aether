using ModernCSharp.Ordering.Domain.Exceptions;

namespace ModernCSharp.Ordering.Infrastructure.Idempotency;

public class RequestManager : IRequestManager
{
    private readonly OrderingDbContext _context;

    public RequestManager(OrderingDbContext context)
    {
        _context = context;
    }

    public async Task CreateRequestForCommandAsync<T>(Guid id)
    {
        var exists = await ExistsAsync(id);

        var request = exists
            ? throw new OrderingDomainException($"Request with {id} alreay exists")
            : new ClientRequest()
            {
                Id = id,
                Name = typeof(T).Name,
                Time = DateTime.UtcNow,
            };

        _context.Add(request);

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        var request = await _context.FindAsync<ClientRequest>(id);

        return request is not null;
    }
}
