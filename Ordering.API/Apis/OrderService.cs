public class OrderService(
    IMediator mediator,
    IOrderQueries queries,
    IIdentityService identityService,
    ILogger<OrderService> logger)
{
    public IMediator Mediator { get; set; } = mediator;
    public IOrderQueries Queries { get; } = queries;
    public IIdentityService IdentityService { get; } = identityService;
    public ILogger<OrderService> Logger { get; } = logger;
}
