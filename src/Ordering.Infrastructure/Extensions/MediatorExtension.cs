namespace ModernCSharp.Ordering.Infrastructure.Extensions;

static class MediatorExtension
{
    public static async Task DispatchDomainEventsAsync(this IMediator mediator, OrderingDbContext context)
    {
        var domainEntries = context.ChangeTracker
            .Entries<IHasDomainEvents>()
            .Where(x => x.Entity.DomainEvents is not null && x.Entity.DomainEvents.Count > 0);

        var domainEvents = domainEntries
            .SelectMany(x => x.Entity.DomainEvents)
            .ToList();

        domainEntries.ToList()
            .ForEach(entity => entity.Entity.ClearDomainEvents());

        foreach (var domainEvent in domainEvents)
        {
            await mediator.Publish(domainEvent);
        }
    }
}
