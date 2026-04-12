namespace DyDanmaku.API.Application.Mappings;

public class DanmakuMapping
{
    public static Danmaku MapToEntity(DanmakuDto danmakuDto)
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
    public static List<Danmaku> MapToEntities(List<DanmakuDto> danmakuDtos)
    {
        return [.. danmakuDtos.Select(MapToEntity)];
    }

    public static DanmakuDto MapToDto(Danmaku danmaku)
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

    public static DanmakuWithRoom MapToWithRoomDto((Danmaku danmaku, Room room) danmakuWithRoom)
    {
        var (danmaku, room) = danmakuWithRoom;
        return new DanmakuWithRoom
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
            RoomName = room.RoomName
        };
    }

    public static List<DanmakuWithRoom> MapToWithRoomDtos(List<(Danmaku danmaku, Room room)> danmakusWithRooms)
    {
        return [.. danmakusWithRooms.Select(MapToWithRoomDto)];
    }

    public static List<DanmakuDto> MapToDtos(List<Danmaku> danmakus)
    {
        return [.. danmakus.Select(MapToDto)];
    }
}
