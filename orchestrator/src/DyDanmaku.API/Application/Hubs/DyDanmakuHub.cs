namespace DyDanmaku.API.Application.Hubs;

public class DyDanmakuHub(
    ILogger<DyDanmakuHub> logger,
    IDanmakuPushService danmakuPushService) : Hub
{
    private static readonly ConcurrentDictionary<string, int> _userRooms = [];

    public async Task JoinRoom(int roomId)
    {
        logger.ZLogInformation($"Room Id: {roomId}");
        var connectionId = Context.ConnectionId;
        var groupName = GetRoomGroupName(roomId);

        _userRooms[connectionId] = roomId;

        await Groups.AddToGroupAsync(connectionId, groupName);

        logger.ZLogInformation($"User {connectionId} joined room: {roomId}");

        await Clients.Caller.SendAsync("RoomJoined", roomId);

        danmakuPushService.StartPushingForRoom(roomId);
    }

    public async Task LeaveRoom(int roomId)
    {
        var connectionId = Context.ConnectionId;
        var groupName = GetRoomGroupName(roomId);

        _userRooms.TryRemove(connectionId, out _);

        await Groups.RemoveFromGroupAsync(connectionId, groupName);

        logger.ZLogInformation($"User {connectionId} left room: {roomId}");

        await Clients.Caller.SendAsync("RoomLeft", roomId);

        danmakuPushService.StopPushingForRoom(roomId);
    }

    public Task Heartbeat()
    {
        return Task.CompletedTask;
    }

    public int? GetCurrentRoom(string connectionId)
    {
        if (_userRooms.TryGetValue(connectionId, out var roomId))
        {
            return roomId;
        }
        return null;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;

        if (_userRooms.TryRemove(connectionId, out var roomId))
        {
            await Groups.RemoveFromGroupAsync(connectionId, GetRoomGroupName(roomId));
            danmakuPushService.StopPushingForRoom(roomId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private static string GetRoomGroupName(int roomId)
    {
        return $"Room_{roomId}";
    }

}
