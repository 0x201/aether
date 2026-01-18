namespace DyDanmaku.API.Dtos;

internal interface IPagedRequest
{
    public int Page { get; set; }
    public int PageSize { get; set; }
}

internal interface ISortedRequest
{
    public string? Sorter { get; set; }
}

internal interface ITimeRangeRequest
{
    public DateTimeOffset? StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
}

internal record PaginationRequest : IPagedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
