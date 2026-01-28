namespace DyDanmaku.API.Application.Models;

public record CaptureJobRequest : PaginationRequest, ISortedRequest, ITimeRangeRequest
{
    public string? UserName { get; set; }
    public string? Content { get; set; }
    public int? RoomId { get; set; }
    public string? Sorter { get; set; }

    public DateTimeOffset? StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
}


public record RoomRequest : PaginationRequest, ISortedRequest
{
    public string? RoomName { get; set; }
    public int? RoomId { get; set; }
    public string? Sorter { get; set; }
}

public record DanmakuAnalysisRequest
{
    public int? TopN { get; set; } = 20;
    public DateTimeOffset? StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
    public int? RoomId { get; set; }
}