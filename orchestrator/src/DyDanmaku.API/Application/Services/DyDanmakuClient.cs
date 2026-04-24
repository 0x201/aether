using System.Buffers;
using System.Buffers.Binary;
using System.IO.Pipelines;

namespace DyDanmaku.API.Application.Services;

internal ref struct DanmakuFrameParser(ReadOnlySpan<byte> data)
{
    private ReadOnlySpan<byte> _remaining = data;
    public bool IsEmpty => _remaining.IsEmpty;

    public int RemainingLength => _remaining.Length;
    public bool TryReadFrame(out ReadOnlySpan<byte> frame)
    {
        frame = default;

        if (_remaining.Length < 4)
        {
            return false;
        }

        var contentLength = BinaryPrimitives.ReadUInt32LittleEndian(_remaining);
        var totalPacketSize = 4 + (int)contentLength;

        if (_remaining.Length < totalPacketSize)
        {
            return false;
        }

        const int HeaderSize = 12;
        var payloadEnd = totalPacketSize - 1;

        if (payloadEnd > HeaderSize)
        {
            frame = _remaining[HeaderSize..payloadEnd];
        }

        _remaining = _remaining[totalPacketSize..];

        return true;
    }
}

public class DyDanmakuClient(
    ILogger<DyDanmakuClient> logger,
    IConfiguration configuration,
    IServiceProvider serviceProvider) : IAsyncDisposable, IDisposable
{
    private static readonly TimeSpan[] ReconnectDelays =
    [
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(2),
        TimeSpan.FromSeconds(4),
        TimeSpan.FromSeconds(8),
        TimeSpan.FromSeconds(16),
        TimeSpan.FromSeconds(30),
    ];
    private string _serverPrefix = configuration.GetSection("Douyu:Apis:DanmakuUrl").Get<string>() ?? "wss://danmuproxy.douyu.com";
    private string _authUserName = configuration.GetSection("Douyu:Auth:UserName").Get<string>() ?? string.Empty;
    private string _authUserId = configuration.GetSection("Douyu:Auth:UserId").Get<string>() ?? string.Empty;
    private readonly Channel<Danmaku> _danmakuChannel = Channel.CreateBounded<Danmaku>(
        new BoundedChannelOptions(500)
        {
            SingleReader = true,
            SingleWriter = false,
            FullMode = BoundedChannelFullMode.DropOldest
        }
    );
    private ClientWebSocket? _client;
    private volatile bool _isConnected;
    private Task? _persisterTask;
    private Task? _heartbeatTask;
    private Task? _receiveTask;
    private CancellationTokenSource _stopCts = new();

    public string ServerUrl { get => field; private set => field = value; } = string.Empty;
    public int RoomId { get => field; private set => field = value; }


    public async Task StartAsync(int roomId, int durationInSeconds = 3600, CancellationToken cancellationToken = default)
    {
        RoomId = roomId;
        int port = 8500 + Random.Shared.Next(1, 6);
        ServerUrl = $"{_serverPrefix}:{port}/";
        logger.ZLogInformation($"Connecting [{ServerUrl}]...");
        _isConnected = false;

        using var durationCts = new CancellationTokenSource(TimeSpan.FromSeconds(durationInSeconds));
        using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, durationCts.Token, _stopCts.Token);
        var ct = combinedCts.Token;

        try
        {
            _client = new ClientWebSocket();
            await _client.ConnectAsync(new Uri(ServerUrl), ct);
            _isConnected = true;

            _persisterTask = Task.Run(() => RunBatchPersisterAsync(ct), ct);
            _receiveTask = Task.Run(() => RunReceivePipeAsync(ct), ct);

            await SendMsgAsync("type@=unsub/mt@=dyh_legend_subscribe/", ct);
            await SendLoginAsync(ct);
            await SendMsgAsync($"type@=joingroup/rid@={RoomId}/gid@=1", ct);

            _heartbeatTask = Task.Run(() => RunHeartbeatAsync(ct), ct);
            await ct.WhenCancelled();
        }
        catch (OperationCanceledException)
        {
            logger.ZLogInformation($"Danmaku capture cancelled for room [{RoomId}]");
        }
        catch (Exception ex)
        {
            logger.ZLogError($"Failed to connect: [{ServerUrl}]. Exception: {ex}");
            throw;
        }
        finally
        {
            await CleanupResources();
        }
    }

    public async Task StopAsync()
    {
        _isConnected = false;
        _stopCts.Cancel();

        if (_client?.State == WebSocketState.Open)
        {
            try
            {
                await SendMsgAsync("type@=logout/", CancellationToken.None);
                await Task.Delay(100);
                await _client.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client closed", CancellationToken.None);
            }
            catch (WebSocketException)
            {
                logger.ZLogWarning($"WebSocket already in invalid state: {_client?.State}");
            }
        }
        logger.ZLogInformation($"Stopped capture for room {RoomId}", RoomId);

        await CleanupResources();

        _stopCts.Dispose();
        _stopCts = new CancellationTokenSource();
    }

    public void Reset()
    {

        _isConnected = false;

        _stopCts.Dispose();
        _stopCts = new CancellationTokenSource();

        try
        {
            _client?.Abort();
            _client?.Dispose();
            _client = null;
        }
        catch (Exception)
        {
            // ignored
        }

        while (_danmakuChannel.Reader.TryRead(out _)) { }

        logger.LogDebug($"DyDanmakuClient has been reset");
    }

    private async Task RunReceivePipeAsync(CancellationToken cancellationToken)
    {
        var pipe = new Pipe();
        var filling = FillPipeAsync(pipe.Writer, cancellationToken);
        var reading = DrainPipeAsync(pipe.Reader, cancellationToken);
        await Task.WhenAll(filling, reading);
    }

    private async Task FillPipeAsync(PipeWriter writer, CancellationToken cancellationToken)
    {
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                if (!_isConnected || _client?.State != WebSocketState.Open)
                {
                    if(!await ReconnectAsync(cancellationToken))
                        break;
                    
                    continue;
                }

                ValueWebSocketReceiveResult result;
                try
                {
                    
                    var memory = writer.GetMemory(4096);
                    using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(65));
                    using var receiveCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

                    result = await _client.ReceiveAsync(memory, receiveCts.Token);
                }
                catch (OperationCanceledException)
                {
                    logger.ZLogInformation($"FillPipeAsync cancelled for room [{RoomId}]");
                    break;
                }
                catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
                {
                    logger.ZLogError($"Receive error for room [{RoomId}]. Exception: {ex}");
                    _isConnected = false;
                    continue;
                }

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    logger.ZLogInformation($"WebSocket connection closed by remote party for room [{RoomId}]");
                    _isConnected = false;
                    continue;
                }

                writer.Advance(result.Count);

                var flushResult = await writer.FlushAsync(cancellationToken);
                if (flushResult.IsCompleted) break;

            }
        }
        catch (Exception ex)
        {
            logger.ZLogError($"FillPipeAsync failed for room [{RoomId}]. Exception: {ex}");
        }
        finally
        {
            await writer.CompleteAsync();
        }
    }

    private async Task DrainPipeAsync(PipeReader reader, CancellationToken cancellationToken)
    {
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                var readResult = await reader.ReadAsync(cancellationToken);
                var buffer = readResult.Buffer;

                SequencePosition consumed = buffer.Start;

                if (!buffer.IsEmpty)
                {
                    int consumedBytes;
                    if (buffer.IsSingleSegment)
                    {
                        var span = buffer.FirstSpan;
                        consumedBytes = ParseAndPublish(span);
                    }
                    else
                    {
                        var length = (int)buffer.Length;
                        var rented = ArrayPool<byte>.Shared.Rent(length);

                        try
                        {
                            buffer.CopyTo(rented);
                            consumedBytes = ParseAndPublish(rented.AsSpan(0, length));
                        }
                        finally
                        {
                            ArrayPool<byte>.Shared.Return(rented);
                        }
                    }

                    if (consumedBytes > 0)
                    {
                        consumed = buffer.Slice(0, consumedBytes).End;
                    }
                }

                reader.AdvanceTo(consumed, buffer.End);
                if (readResult.IsCompleted) break;
            }
        }
        catch (OperationCanceledException)
        {
            logger.ZLogInformation($"DrainPipeAsync cancelled for room [{RoomId}]");
        }
        catch (Exception ex)
        {
            logger.ZLogError($"DrainPipeAsync error for room [{RoomId}]. Exception: {ex}");
        }
        finally
        {
            await reader.CompleteAsync();
        }
    }

    private int ParseAndPublish(ReadOnlySpan<byte> data)
    {
        var parser = new DanmakuFrameParser(data);
        while (parser.TryReadFrame(out var frame))
        {
            if (frame.IsEmpty) continue;

            var msgStr = Encoding.UTF8.GetString(frame);
            if (TryParseChatMessage(msgStr) is { } danmaku)
            {
                _danmakuChannel.Writer.TryWrite(danmaku);
            }
        }
        return data.Length - parser.RemainingLength;
    }

    private Danmaku? TryParseChatMessage(string msgStr)
    {
        if (string.IsNullOrEmpty(msgStr)) return null;

        if (msgStr.Contains('\0'))
        {
            Danmaku? last = null;
            foreach (var part in msgStr.Split('\0', StringSplitOptions.RemoveEmptyEntries))
            {
                last = TryParseChatMessage(part);
            }
            return last;
        }

        var fields = ParseDouyuFields(msgStr);
        if (fields is null) return null;
        if (!fields.TryGetValue("type", out var type) || type != "chatmsg") return null;

        fields.TryGetValue("rid", out var rid);
        fields.TryGetValue("uid", out var uid);
        fields.TryGetValue("nn", out var nn);
        fields.TryGetValue("txt", out var txt);
        fields.TryGetValue("level", out var level);

        string? fanMedalName = null;
        int? fanMedalLevel = null;
        if (fields.TryGetValue("bnn", out var bnn)
            && !string.IsNullOrEmpty(bnn)
            && fields.TryGetValue("bl", out var bl)
            && !string.IsNullOrEmpty(bl))
        {
            fanMedalName = bnn;
            fanMedalLevel = int.TryParse(bl, out var blv) ? blv : null;
        }

        return new Danmaku
        {
            RoomId = int.TryParse(rid, out var roomId) ? roomId : null,
            UserId = uid ?? string.Empty,
            UserName = nn ?? string.Empty,
            Content = txt ?? string.Empty,
            UserLevel = int.TryParse(level, out var levelInt) ? levelInt : null,
            FanMedalName = fanMedalName,
            FanMedalLevel = fanMedalLevel,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }

    private Dictionary<string, string>? ParseDouyuFields(string msgStr)
    {
        try
        {
            var result = new Dictionary<string, string>();
            var msgSpan = msgStr.AsSpan();
            foreach (var range in msgSpan.Split('/'))
            {
                var segement = msgSpan[range];
                if (segement.IsEmpty) continue;

                var part = segement.ToString().Replace("@s", "/").Replace("@A", "@");
                var eqIdx = part.IndexOf("@=", StringComparison.Ordinal);

                if (eqIdx > 0)
                {
                    result[part[..eqIdx]] = part[(eqIdx + 2)..];
                }
            }
            return result;
        }
        catch (Exception ex)
        {
            logger.ZLogError($"An error occurred while parsing message from: [{ServerUrl}]. Exception: {ex}");
            return null;
        }
    }

    private async Task RunBatchPersisterAsync(CancellationToken cancellationToken)
    {
        const int BatchSize = 20;
        const int FlushIntervalSeconds = 5;
        var batch = new List<Danmaku>(BatchSize);

        using var flushTimer = new PeriodicTimer(TimeSpan.FromSeconds(FlushIntervalSeconds));
        var flushTimerTask = flushTimer.WaitForNextTickAsync(cancellationToken).AsTask();

        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                var readTask = _danmakuChannel.Reader.WaitToReadAsync(cancellationToken).AsTask();
                var completed = await Task.WhenAny(readTask, flushTimerTask);
                var timerFired = completed == flushTimerTask;

                if (completed == readTask)
                {
                    while (batch.Count < BatchSize && _danmakuChannel.Reader.TryRead(out var item))
                    {
                        batch.Add(item);
                    }
                }
                else
                {
                    flushTimerTask = flushTimer.WaitForNextTickAsync(cancellationToken).AsTask();
                }

                if (batch.Count >= BatchSize || (timerFired && batch.Count > 0))
                {
                    await PersistBatchAsync(batch, cancellationToken);
                    batch.Clear();
                }
            }
        }
        catch (OperationCanceledException)
        {
            logger.ZLogInformation($"BatchPersister cancelled for room [{RoomId}]");
        }
        catch (Exception ex)
        {
            logger.ZLogError($"BatchPersister error for room [{RoomId}]. Exception: {ex}");
        }
        finally
        {
            while (_danmakuChannel.Reader.TryRead(out var item)) batch.Add(item);
            if (batch.Count > 0) await PersistBatchAsync(batch, CancellationToken.None);
        }
    }

    private async Task PersistBatchAsync(List<Danmaku> batch, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<DyDanmakuDbContext>();
            await dbContext.Danmakus.AddRangeAsync(batch, cancellationToken);
            var saved = await dbContext.SaveChangesAsync(cancellationToken);
            logger.ZLogInformation($"Saved [{saved}] danmaku(s) to database for room [{RoomId}]");
        }
        catch (Exception ex)
        {
            logger.ZLogError($"Failed to persist danmaku batch for room [{RoomId}]. Exception: {ex}");
        }
    }

    private async Task RunHeartbeatAsync(CancellationToken cancellationToken)
    {
        await SendMsgAsync("type@=mrkl/", cancellationToken);

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(45));

        try
        {
            while (await timer.WaitForNextTickAsync(cancellationToken))
            {
                if (_isConnected && _client?.State == WebSocketState.Open)
                {
                    await SendMsgAsync("type@=mrkl/", cancellationToken);
                }
            }
        }
        catch (OperationCanceledException)
        {
            logger.ZLogInformation($"Heartbeat cancelled for room [{RoomId}]");
        }
    }

    private async Task<bool> ReconnectAsync(CancellationToken cancellationToken)
    {
        logger.ZLogInformation($"Attempting to reconnect for room [{RoomId}]...");

        for (int attempt = 0; attempt < ReconnectDelays.Length; attempt++)
        {
            if (cancellationToken.IsCancellationRequested) return false;

            try
            {
                _client?.Dispose();
                _client = new ClientWebSocket();
                await _client.ConnectAsync(new Uri(ServerUrl), cancellationToken);
                _isConnected = true;

                await SendMsgAsync("type@=unsub/mt@=dyh_legend_subscribe/", cancellationToken);
                await SendLoginAsync(cancellationToken);
                await SendMsgAsync($"type@=joingroup/rid@={RoomId}/gid@=1", cancellationToken);

                logger.ZLogInformation($"Reconnected succcessfully for romm [{RoomId}]");
                return true;
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                var baseDelay = ReconnectDelays[attempt];
                var jitter = TimeSpan.FromMilliseconds(baseDelay.TotalMilliseconds * Random.Shared.NextDouble() * 0.3);
                var delay = baseDelay + jitter;

                logger.ZLogError($"Reconnect attempt {attempt + 1}/{ReconnectDelays.Length} failed for room [{RoomId}], retrying in {delay.TotalSeconds:F1}s. Exception: {ex}");

                try
                {
                    await Task.Delay(delay, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    return false;
                }
            }
        }

        logger.ZLogError($"All reconnect attempts failed for room [{RoomId}]. Giving up");
        return false;
    }

    private async Task CleanupResources()
    {
        if (_persisterTask is not null)
        {
            _danmakuChannel.Writer.TryComplete();
            try
            {
                await _persisterTask;
            }
            catch (Exception) { }

            _persisterTask = null;
        }

        if (_heartbeatTask is not null)
        {
            try
            {
                await _heartbeatTask;
            }
            catch (Exception) { }
            _heartbeatTask = null;
        }

        if (_receiveTask is not null)
        {
            try
            {
                await _receiveTask;
            }
            catch (Exception) { }
            _receiveTask = null;
        }

        if (_client?.State == WebSocketState.Open)
        {
            try
            {
                await _client.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client closed", CancellationToken.None);
            }
            catch (WebSocketException)
            {
                logger.ZLogWarning($"WebSocket already in invalid state during cleanup: {_client?.State}");
            }
        }
    }

    private async ValueTask SendLoginAsync(CancellationToken cancellationToken)
    {
        var loginMsg = $"type@=loginreq/roomid@={RoomId}/dfl@=sn@AA=106@ASss@AA=1@Ssn@AA=107@ASss@AA=1@Ssn@AA=108@ASss@AA=1@Ssn@AA=105@ASss@AA=1/username@={_authUserName}/uid@=${_authUserId}/ver@=20220825/aver@=218101901/ct@=0/";
        await SendMsgAsync(loginMsg, cancellationToken);
    }

    public async ValueTask SendCloseGiftAsync(CancellationToken cancellationToken = default)
    {
        var closeGiftMsg = "type@=dmfbdreq/dfl@=sn@AA=105@ASss@AA=1@AS@Ssn@AA=106@ASss@AA=1@AS@Ssn@AA=107@ASss@AA=1@AS@Ssn@AA=108@ASss@AA=1@AS@Ssn@AA=110@ASss@AA=1@AS@Ssn@AA=901@ASss@AA=1@AS@S/";
        await SendMsgAsync(closeGiftMsg, cancellationToken);
    }

    private async ValueTask SendMsgAsync(string msg, CancellationToken cancellationToken)
    {
        if (_client?.State != WebSocketState.Open) return;
        var payload = MsgEncode(msg);
        try
        {
            await _client.SendAsync(payload.AsMemory(), WebSocketMessageType.Binary, true, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.ZLogError($"SendMsg failed for room [{RoomId}]. Exception: {ex}");
        }
    }

    private static byte[] MsgEncode(string msg)
    {
        var msgWithNull = msg + '\0';
        var msgByteCount = Encoding.UTF8.GetByteCount(msgWithNull);
        var totalLength = msgByteCount + 8;

        var result = new byte[12 + msgByteCount];
        var span = result.AsSpan();

        BinaryPrimitives.WriteUInt32LittleEndian(span[..4], (uint)totalLength);
        BinaryPrimitives.WriteUInt32LittleEndian(span[4..8], (uint)totalLength);
        BinaryPrimitives.WriteUInt16LittleEndian(span[8..10], 689);
        span[10] = 0;
        span[11] = 0;

        Encoding.UTF8.GetBytes(msgWithNull.AsSpan(), span[12..]);

        return result;
    }

    public void Dispose()
    {
        _danmakuChannel.Writer.TryComplete();
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }

    public async ValueTask DisposeAsync()
    {
        await CleanupResources();
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}

static class CancellationTokenSupport
{
    extension(CancellationToken cancellationToken)
    {
        public Task WhenCancelled()
        {
            if (cancellationToken.IsCancellationRequested)
            {
                return Task.CompletedTask;
            }
            var tcs = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            cancellationToken.Register(static s => ((TaskCompletionSource)s!).TrySetResult(), tcs);
            return tcs.Task;
        }
    }
}

public sealed class DyDanmakuClientLease : IAsyncDisposable
{
    private readonly DyDanmakuClientPool _pool;
    private readonly IServiceScope _scope;
    private bool _returned;
    public DyDanmakuClient Client { get; }

    internal DyDanmakuClientLease(DyDanmakuClient client, IServiceScope scope, DyDanmakuClientPool pool)
    {
        Client = client;
        _scope = scope;
        _pool = pool;
    }

    public async ValueTask DisposeAsync()
    {
        if (_returned) return;
        _returned = true;
        await _pool.ReturnClientAsync(Client, _scope);
    }
}


public sealed class DyDanmakuClientPool : IAsyncDisposable
{
    private readonly Channel<(DyDanmakuClient Client, IServiceScope Scope)> _pool;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DyDanmakuClientPool> _logger;

    public DyDanmakuClientPool(IServiceProvider serviceProvider, ILogger<DyDanmakuClientPool> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;

        _pool = Channel.CreateBounded<(DyDanmakuClient, IServiceScope)>(new BoundedChannelOptions(10)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = false,
            SingleWriter = false,
        });

        for (int i = 0; i < 5; i++)
        {
            var (client, scope) = CreateClientWithScope();
            if (!_pool.Writer.TryWrite((client, scope)))
            {
                client.Dispose();
                scope.Dispose();
            }
        }
    }

    public ValueTask<DyDanmakuClientLease> RentAsync()
    {
        if (_pool.Reader.TryRead(out var entry))
        {
            return ValueTask.FromResult(new DyDanmakuClientLease(entry.Client, entry.Scope, this));
        }
        var (newClient, newScope) = CreateClientWithScope();
        return ValueTask.FromResult(new DyDanmakuClientLease(newClient, newScope, this));
    }

    public async ValueTask ReturnClientAsync(DyDanmakuClient client, IServiceScope scope)
    {
        client.Reset();

        if (_pool.Writer.TryWrite((client, scope)))
        {
            _logger.LogDebug($"Returned DanmakuClient to pool");
        }
        else
        {
            _logger.LogDebug($"Pool full, disposing DanmakuClient");
            await client.DisposeAsync();
            scope.Dispose();
        }
    }

    private (DyDanmakuClient, IServiceScope Scope) CreateClientWithScope()
    {
        var scope = _serviceProvider.CreateScope();
        var client = new DyDanmakuClient(
            scope.ServiceProvider.GetRequiredService<ILogger<DyDanmakuClient>>(),
            scope.ServiceProvider.GetRequiredService<IConfiguration>(),
            scope.ServiceProvider
        );
        return (client, scope);
    }

    public async ValueTask DisposeAsync()
    {
        _pool.Writer.Complete();

        while (_pool.Reader.TryRead(out var entry))
        {
            await entry.Client.DisposeAsync();
            entry.Scope.Dispose();
        }
    }
}