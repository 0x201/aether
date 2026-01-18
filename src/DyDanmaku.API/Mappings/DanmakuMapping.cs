namespace DyDanmaku.API.Mappings;

internal class DanmakuMapping
{
    internal static Danmaku MapToEntity(DanmakuDto danmakuDto)
    {
        return new Danmaku
        {
            UserId = danmakuDto.UserId,
            UserName = danmakuDto.UserName,
            Content = danmakuDto.Content,
            FanMedalName = danmakuDto.FanMedalName,
            FanMedalLevel = danmakuDto.FanMedalLevel,
            UserLevel = danmakuDto.UserLevel,
            RoomId = danmakuDto.RoomId,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
    internal static List<Danmaku> MapToEntities(List<DanmakuDto> danmakuDtos)
    {
        return [.. danmakuDtos.Select(MapToEntity)];
    }

    internal static DanmakuDto MapToDto(Danmaku danmaku)
    {
        return new DanmakuDto
        {
            Id = danmaku.Id,
            UserId = danmaku.UserId ?? string.Empty,
            UserName = danmaku.UserName ?? string.Empty,
            Content = danmaku.Content ?? string.Empty,
            FanMedalName = danmaku.FanMedalName,
            FanMedalLevel = danmaku.FanMedalLevel,
            UserLevel = danmaku.UserLevel,
            RoomId = danmaku.RoomId,
            CreatedAt = danmaku.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"),
        };
    }

    internal static List<DanmakuDto> MapToDtos(List<Danmaku> danmakus)
    {
        return [.. danmakus.Select(MapToDto)];
    }
}
