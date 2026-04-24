namespace DyDanmaku.API.Application.Services;

public class DanmakuPushService(
    IServiceScopeFactory serviceScopeFactory,
    IHubContext<DyDanmakuHub> hubContext,
    ILogger<DanmakuPushService> logger)
    : IDanmakuPushService, IHostedService, IDisposable
{
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private readonly Dictionary<int, (CancellationTokenSource cts, int ConnectionCount)> _rooms = [];
    private readonly ConcurrentDictionary<int, DateTimeOffset> _lastPushTime = [];
    private bool _dispose;

    public void Dispose()
    {
        if (_dispose)
        {
            return;
        }
        _dispose = true;
        _semaphore.Wait();
        try
        {
            foreach (var (cts, _) in _rooms.Values)
            {
                cts.Cancel();
                cts.Dispose();
            }
            _rooms.Clear();
        }
        finally
        {
            _semaphore.Release();
            _semaphore.Dispose();
        }
        GC.SuppressFinalize(this);
    }

    private async Task RunPeriodicPushAsync(int roomId, CancellationToken cancellationToken = default)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(2));
        try
        {
            while (await timer.WaitForNextTickAsync(cancellationToken))
            {
                await PushDanmakuForRoom(roomId, cancellationToken);
            }
        }
        catch (OperationCanceledException) { }
    }

    private async Task PushDanmakuForRoom(int roomId, CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<DyDanmakuDbContext>();

            var lastPushTime = _lastPushTime.GetValueOrDefault(roomId, DateTimeOffset.UtcNow.AddSeconds(-10));

            var newDanmakus = await dbContext.Danmakus
                .Where(d => d.RoomId == roomId && d.CreatedAt > lastPushTime)
                .OrderBy(d => d.CreatedAt)
                .Take(30)
                .ToListAsync(cancellationToken);

            if (newDanmakus.Count > 0)
            {
                logger.ZLogInformation($"Room: {roomId} found {newDanmakus.Count} new danmaku");

                var danmakuDtos = newDanmakus
                    .Select(DanmakuMapping.MapToDto)
                    .ToList();
                await hubContext.Clients.Group($"Room_{roomId}")
                    .SendAsync("ReceiveDanmakus", danmakuDtos, cancellationToken);
                _lastPushTime[roomId] = newDanmakus.Max(d => d.CreatedAt);
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            logger.ZLogError($"An error occurred while pushing danmaku for room: {roomId}. Exception: {ex}");
        }
    }

    public async Task PushNewDanmakuToRoom(int roomId)
    {
        await PushDanmakuForRoom(roomId);
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        logger.ZLogInformation($"Danmaku Pushing service started");
        return Task.CompletedTask;
    }

    public void StartPushingForRoom(int roomId)
    {
        _semaphore.Wait();
        try
        {
            if (_rooms.TryGetValue(roomId, out var existing))
            {
                _rooms[roomId] = existing with { ConnectionCount = existing.ConnectionCount + 1 };
                return;
            }

            var cts = new CancellationTokenSource();
            _rooms[roomId] = (cts, 1);
            _lastPushTime[roomId] = DateTimeOffset.UtcNow.AddSeconds(-10);
            _ = Task.Run(() => RunPeriodicPushAsync(roomId, cts.Token));
        }
        finally
        {
            _semaphore.Release();
        }
        logger.ZLogInformation($"Started pushing danmaku for room: {roomId}");

    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _semaphore.Wait();
        try
        {
            foreach (var (cts, _) in _rooms.Values)
            {
                cts.Cancel();
                cts.Dispose();
            }
            _rooms.Clear();
        }
        finally
        {
            _semaphore.Release();
        }

        _lastPushTime.Clear();

        return Task.CompletedTask;
    }

    public void StopPushingForRoom(int roomId)
    {
        CancellationTokenSource? ctsToDispose = null;
        _semaphore.Wait();
        try
        {
            if (!_rooms.TryGetValue(roomId, out var existing))
            {
                return;
            }

            if (existing.ConnectionCount > 1)
            {
                _rooms[roomId] = existing with { ConnectionCount = existing.ConnectionCount - 1 };
                return;
            }

            ctsToDispose = existing.cts;
            _rooms.Remove(roomId);
            _lastPushTime.TryRemove(roomId, out _);

        }
        finally
        {
            _semaphore.Release();
        }
        logger.ZLogInformation($"Stopped pushing danmaku for room: {roomId}");
    }
}
