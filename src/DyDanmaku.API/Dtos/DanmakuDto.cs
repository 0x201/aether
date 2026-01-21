namespace DyDanmaku.API.Dtos;

internal record DanmakuDto
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? Content { get; set; }
    public string? FanMedalName { get; set; }
    public int? FanMedalLevel { get; set; }
    public int? UserLevel { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public int? RoomId { get; set; }
}

internal record DanmakuWithRoom : DanmakuDto
{
    public string RoomName { get; set; } = string.Empty;
}


internal record TopUser
{
    public string? UserName { get; set; }
    public int Count { get; set; }
}

internal record TopRoom
{
    public int RoomId { get; set; }
    public string? RoomName { get; set; }
    public int Count { get; set; }
}

internal record HourlyDistribution
{
    public string Hour { get; set; } = string.Empty;
    public int Count { get; set; }
}

internal record DanmakuStats
{
    public int TotalCount { get; set; }
    public int UniqueUsers { get; set; }
    public IReadOnlyList<TopUser> TopUsers { get; set; } = [];
    public IReadOnlyList<TopRoom> TopRooms { get; set; } = [];
    public IReadOnlyList<HourlyDistribution> HourlyDistributions { get; set; } = [];
}

internal record WordFrequency
{
    public string Word { get; set; } = string.Empty;
    public int Count { get; set; }
}

internal record DataCount(int DanmakuCount, int RoomCount, int UserCount);