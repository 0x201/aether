namespace Aether.Ordering.Infrastructure.Idempotency;

public class RequestManager(OrderingDbContext context) : IRequestManager
{
    public async Task CreateRequestForCommandAsync<T>(Guid id)
    {
        var exists = await ExistsAsync(id);

        var request = exists
            ? throw new OrderingDomainException($"Request with {id} already exists")
            : new ClientRequest()
            {
                Id = id,
                Name = typeof(T).Name,
                Time = DateTime.UtcNow,
            };

        context.Add(request);

        await context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        var request = await context.FindAsync<ClientRequest>(id);

        return request is not null;
    }
}
