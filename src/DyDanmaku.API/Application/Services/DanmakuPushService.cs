namespace DyDanmaku.API.Application.Services;

public class DanmakuPushService(
    IServiceProvider serviceProvider,
    IHubContext<DyDanmakuHub> hubContext,
    ILogger<DanmakuPushService> logger)
    : IDanmakuPushService, IHostedService, IDisposable
{
    private readonly Dictionary<int, Timer> _roomTimers = [];
    private readonly Dictionary<int, DateTimeOffset> _lastPushTime = [];
    private readonly HashSet<string> _sentDanmakuIds = [];

    public void Dispose()
    {
        foreach (var timer in _roomTimers.Values)
        {
            timer?.Dispose();
        }
    }

    private async Task PushDanmakuForRoom(int roomId)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<DyDanmakuDbContext>();

            // Get the last push time for this room, defaulting to 10 seconds ago if not found
            var lastPushTime = _lastPushTime.GetValueOrDefault(roomId, DateTimeOffset.UtcNow.AddSeconds(-10));

            // Query for new danmakus since the last push time, ordered by creation time
            var newDanmakus = await dbContext.Danmakus
                .Where(d => d.RoomId == roomId && d.CreatedAt > lastPushTime)
                .OrderBy(d => d.CreatedAt)
                .Take(30)
                .ToListAsync();

            if (newDanmakus.Count > 0)
            {
                logger.LogInformation("Room: {RoomId} found {Count} new danmaku", roomId, newDanmakus.Count);

                // Filter out already sent danmakus using the _sentDanmakuIds set
                var danmakuDtos = newDanmakus
                    .Where(d => !_sentDanmakuIds.Contains($"{d.RoomId}_{d.Id}"))
                    .Select(DanmakuMapping.MapToDto)
                    .ToList();

                if (danmakuDtos.Count > 0)
                {
                    await hubContext.Clients.Group($"Room_{roomId}")
                        .SendAsync("ReceiveNewDanmaku", danmakuDtos);

                    // Add the sent danmaku IDs to the tracking set
                    foreach (var danmaku in newDanmakus)
                    {
                        _sentDanmakuIds.Add($"{danmaku.RoomId}_{danmaku.Id}");
                    }

                    // Update the last push time to the latest danmaku's creation time
                    _lastPushTime[roomId] = newDanmakus.Max(d => d.CreatedAt);

                    // Clean up old IDs to prevent the set from growing indefinitely
                    if (_sentDanmakuIds.Count > 1000)
                    {
                        // Remove 500 oldest entries to maintain performance
                        var idsToRemove = _sentDanmakuIds
                            .OrderBy(x => x) // This is a simple approach; in real usage, we'd need a better timestamp-based cleanup
                            .Take(500)
                            .ToList();

                        foreach (var id in idsToRemove)
                        {
                            _sentDanmakuIds.Remove(id);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while pushing danmaku for room: {RoomId}", roomId);
        }
    }

    public async Task PushNewDanmakuToRoom(int roomId)
    {
        await PushDanmakuForRoom(roomId);
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Danmaku Pushing service started");
        return Task.CompletedTask;
    }

    public void StartPushingForRoom(int roomId)
    {
        if (_roomTimers.ContainsKey(roomId))
        {
            return;
        }

        var timer = new Timer(async state => await PushDanmakuForRoom((int)state!),
            roomId, TimeSpan.Zero, TimeSpan.FromSeconds(2));

        _roomTimers[roomId] = timer;
        _lastPushTime[roomId] = DateTimeOffset.UtcNow.AddSeconds(-10);

        logger.LogInformation("Started pushing danmaku for room: {RoomId}", roomId);

    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Danmaku Push service ended");

        foreach (var timer in _roomTimers.Values)
        {
            timer?.Dispose();
        }

        _roomTimers.Clear();
        _lastPushTime.Clear();

        return Task.CompletedTask;
    }

    public void StopPushingForRoom(int roomId)
    {
        if (_roomTimers.TryGetValue(roomId, out var timer))
        {
            timer?.Dispose();

            _roomTimers.Remove(roomId);
            _lastPushTime.Remove(roomId);

            logger.LogInformation("Stopped pushing danmaku for room: {RoomId}", roomId);
        }
    }
}
