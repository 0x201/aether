using System.Text.Json.Serialization;

namespace DyDanmaku.API.Application.Models;

public record DanmakuDto
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

public record DanmakuWithRoom : DanmakuDto
{
    public string RoomName { get; set; } = string.Empty;
}


public record TopUser
{
    public string? UserName { get; set; }
    public int Count { get; set; }
}

public record TopRoom
{
    public int RoomId { get; set; }
    public string? RoomName { get; set; }
    public int Count { get; set; }
}

public record HourlyDistribution
{
    public string Hour { get; set; } = string.Empty;
    public int Count { get; set; }
}

public record DanmakuStats
{
    public int TotalCount { get; set; }
    public int UniqueUsers { get; set; }
    public IReadOnlyList<TopUser> TopUsers { get; set; } = [];
    public IReadOnlyList<TopRoom> TopRooms { get; set; } = [];
    public IReadOnlyList<HourlyDistribution> HourlyDistributions { get; set; } = [];
}



public record WordFrequency
{
    public string Word { get; set; } = string.Empty;
    public int Count { get; set; }
}

public record DataCount(int DanmakuCount, int RoomCount, int UserCount);


[JsonSerializable(typeof(DanmakuStats))]
[JsonSerializable(typeof(TopUser))]
[JsonSerializable(typeof(TopRoom))]
[JsonSerializable(typeof(HourlyDistribution))]
[JsonSerializable(typeof(IReadOnlyList<TopUser>))]
[JsonSerializable(typeof(IReadOnlyList<TopRoom>))]
[JsonSerializable(typeof(IReadOnlyList<HourlyDistribution>))]
[JsonSerializable(typeof(Dictionary<string, object>))]
public partial class DanmakuJsonSerializerContext : JsonSerializerContext
{
}