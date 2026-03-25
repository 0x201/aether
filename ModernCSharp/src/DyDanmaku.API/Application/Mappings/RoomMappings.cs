namespace DyDanmaku.API.Application.Mappings;

internal class RoomMapping
{
    internal static Room MapToEntity(RoomDto roomDto)
    {
        return new Room
        {
            RoomName = roomDto.AnchorName,
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
            AnchorName = room.RoomName,
            RoomId = room.RoomId,
        };
    }

    internal static List<RoomDto> MapToDtos(List<Room> rooms)
    {
        return [.. rooms.Select(MapToDto)];
    }
}
