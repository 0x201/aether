namespace Aether.Shared.Models;

public interface IPagedRequest
{
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public interface ISortedRequest
{
    public string? Sorter { get; set; }
}

public interface ITimeRangeRequest
{
    public DateTimeOffset? StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
}

public record PaginationRequest : IPagedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
