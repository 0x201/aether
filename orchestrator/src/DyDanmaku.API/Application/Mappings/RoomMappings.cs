namespace DyDanmaku.API.Application.Mappings;

internal class RoomMapping
{
    internal static Room MapToEntity(RoomDto roomDto)
    {
        return new Room
        {
            RoomName = roomDto.RoomName,
            RoomId = roomDto.RoomId,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
    internal static List<Room> MapToEntities(List<RoomDto> roomDtos)
    {
        return [.. roomDtos.Select(MapToEntity)];
    }

    internal static RoomDto MapToDto(Room room)
    {
        return new RoomDto
        {
            Id = room.Id,
            RoomName = room.RoomName,
            RoomId = room.RoomId,
            CreatedAt = room.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss")
        };
    }

    internal static List<RoomDto> MapToDtos(List<Room> rooms)
    {
        return [.. rooms.Select(MapToDto)];
    }
}
