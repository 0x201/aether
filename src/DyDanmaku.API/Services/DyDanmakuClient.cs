using System.Net.WebSockets;
using System.Text;

namespace DyDanmaku.API.Services;

internal class DyDanmakuClient(
    ILogger<DyDanmakuClient> logger,
    ICaptureJobRepository captureJobService,
    IConfiguration configuration,
    IServiceProvider serviceProvider)
{
    private string SERVERPREFIX = configuration.GetSection("Douyu:Apis:DanmakuUrl").Get<string>() ?? "wss://danmuproxy.douyu.com";
    private string _serverUrl = string.Empty;
    private int _roomId;
    private ClientWebSocket? _client;
    private Timer? _heartbeatTimer;
    private bool _isConnected;
    private bool _isStopping = false;
    private CancellationTokenSource? _cancellationTokenSource;
    private readonly List<Danmaku> _danmakuBuffer = [];
    private readonly SemaphoreSlim _bufferSemaphore = new(1, 1);
    private Timer? _flushTimer;

    public string ServerUrl { get { return _serverUrl; } }
    public int RoomId { get { return _roomId; } }


    public async Task StartAsync(int roomId, int durationInSeconds = 3600, CancellationToken cancellationToken = default)
    {
        _roomId = roomId;
        int port = 8500 + Random.Shared.Next(1, 6);
        _serverUrl = $"{SERVERPREFIX}:{port}/";
        logger.LogInformation("Connecting [{Url}]...", _serverUrl);
        _isConnected = false;

        using var durationCts = new CancellationTokenSource(TimeSpan.FromSeconds(durationInSeconds));
        using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, durationCts.Token);

        try
        {
            _client = new ClientWebSocket();
            await _client.ConnectAsync(new Uri(_serverUrl), combinedCts.Token);

            _isConnected = true;

            _ = Task.Run(() => ReceiveLoop(combinedCts.Token), combinedCts.Token);

            Precheck();
            Login();
            JoinGroup();
            StartHeartbeat();

            await combinedCts.Token.WhenCanceled();

            logger.LogInformation("Danmaku capture completed for room [{RoomId}] due to timeout", RoomId);
            await captureJobService.UpdateJobStatusAsync(roomId, JobStatus.Completed, combinedCts.Token);
            DanmakuApi.CaptureServices.TryRemove(roomId, out var _);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Danmaku capture cancelled for room [{RoomId}]", RoomId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to connect: [{ServerUrl}]", _serverUrl);
            throw;
        }
        finally
        {
            await CleanupResources();
        }
    }

    public async Task StopAsync()
    {
        _isStopping = true;
        _isConnected = false;

        if (_client?.State == WebSocketState.Open)
        {
            try
            {
                await LogoutAsync();
                await _client.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client closed", CancellationToken.None);
            }
            catch (WebSocketException)
            {
                logger.LogWarning("WebSocket already in invalid state: {State}", _client?.State);
            }
        }
        logger.LogInformation("Stopped capture for room {RoomId}", RoomId);

        _heartbeatTimer?.Dispose();
        _flushTimer?.Dispose();
        _cancellationTokenSource?.Cancel();

        await FlushBufferAsync();

        _isStopping = false;
    }

    private async Task ReceiveLoop(CancellationToken cancellationToken = default)
    {
        var buffer = new byte[1024 * 4];
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                if (!_isConnected || _client?.State != WebSocketState.Open)
                {
                    if (!cancellationToken.IsCancellationRequested && !_isStopping)
                    {
                        await ReconnectAsync(cancellationToken);
                    }
                    else
                    {
                        break;
                    }
                }

                if (_isConnected && _client?.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
                {
                    var receiveCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    receiveCts.CancelAfter(TimeSpan.FromSeconds(30));

                    var result = await _client.ReceiveAsync(new ArraySegment<byte>(buffer), receiveCts.Token);

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var messageBytes = new byte[result.Count];
                        Array.Copy(buffer, messageBytes, result.Count);
                        var message = Encoding.UTF8.GetString(messageBytes);

                        await OnMessage(message);
                    }
                    else if (result.MessageType == WebSocketMessageType.Binary)
                    {
                        var messageBytes = new byte[result.Count];
                        Array.Copy(buffer, messageBytes, result.Count);

                        var messages = MsgDecode(messageBytes);
                        foreach (var msgStr in messages)
                        {
                            await OnMessage(msgStr);
                        }
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        _isConnected = false;
                        logger.LogInformation("WebSocket connection closed by remote party for room [{RoomId}]", RoomId);

                        if (!cancellationToken.IsCancellationRequested && !_isStopping)
                        {
                            await ReconnectAsync(cancellationToken);
                        }
                    }
                }
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("ReceiveLoop cancelled for room [{RoomId}]", RoomId);
        }
        catch (WebSocketException ex) when (ex.Message.Contains("closed the WebSocket connection"))
        {
            logger.LogInformation("WebSocket connection terminated by remote party for room [{RoomId}]: {Message}", RoomId, ex.Message);
            _isConnected = false;
            if (!cancellationToken.IsCancellationRequested && !_isStopping)
            {
                await ReconnectAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred in ReceiveLoop for room [{RoomId}]: {Message}", RoomId, ex.Message);
            if (!cancellationToken.IsCancellationRequested && !_isStopping)
            {
                await ReconnectAsync(cancellationToken);
            }
        }
    }

    private async Task<bool> ReconnectAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to reconnect for room [{RoomId}]...", RoomId);

        _heartbeatTimer?.Dispose();
        _heartbeatTimer = null;

        try
        {
            if (_client?.State == WebSocketState.Open)
            {
                await _client.CloseAsync(WebSocketCloseStatus.NormalClosure, "Reconnecting", CancellationToken.None);
            }

            _client = new ClientWebSocket();
            await _client.ConnectAsync(new Uri(_serverUrl), cancellationToken);

            _isConnected = true;

            Precheck();
            Login();
            JoinGroup();

            StartHeartbeat();

            logger.LogInformation("Reconnected successfully for room [{RoomId}]", RoomId);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to reconnect for room [{RoomId}], retrying in 5 seconds...", RoomId);
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
                return false;
            }
            catch (OperationCanceledException)
            {
                return false;
            }
        }
    }

    private async Task CleanupResources()
    {
        _heartbeatTimer?.Dispose();
        _flushTimer?.Dispose();

        if (_client?.State == WebSocketState.Open)
        {
            try
            {
                var logoutMsg = "type@=logout/";
                SendMsg(logoutMsg);
                await Task.Delay(100);

                await _client.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client closed", CancellationToken.None);
            }
            catch (WebSocketException)
            {
                logger.LogWarning("WebSocket already in invalid state during cleanup: {State}", _client?.State);
            }
        }

        await FlushBufferAsync();
    }

    private async Task OnMessage(string message)
    {
        try
        {
            List<string> messages = string.IsNullOrEmpty(message) ? [] : [message];
            if (message.Contains('\0'))
            {
                messages = MsgDecode(Encoding.UTF8.GetBytes(message));
            }

            var chatMsgList = new List<Danmaku>();
            foreach (var msgStr in messages)
            {
                var msg = MsgFormat(msgStr);

                if (msg is not null && msg.TryGetValue("type", out string? value) && value == "chatmsg")
                {
                    var roomid = msg.TryGetValue("rid", out string? rid) ? rid : "";
                    var userid = msg.TryGetValue("uid", out string? uid) ? uid : "";
                    var username = msg.TryGetValue("nn", out string? nn) ? nn : "";
                    var content = msg.TryGetValue("txt", out string? txt) ? txt : "";
                    var fanMedalName = "";
                    var fanMedalLevel = "";

                    if (msg.TryGetValue("bnn", out string? bnn) && !string.IsNullOrEmpty(bnn) &&
                        msg.TryGetValue("bl", out string? bl) && !string.IsNullOrEmpty(bl))
                    {
                        fanMedalName = bnn;
                        fanMedalLevel = bl;
                    }
                    var level = msg.TryGetValue("level", out string? lv) ? lv : "";

                    var danmaku = new Danmaku
                    {
                        UserId = userid,
                        UserName = username,
                        Content = content,
                        FanMedalName = fanMedalName,
                        FanMedalLevel = !string.IsNullOrEmpty(fanMedalLevel) ? int.Parse(fanMedalLevel) : null,
                        UserLevel = !string.IsNullOrEmpty(level) ? int.Parse(level) : null,
                        CreatedAt = DateTimeOffset.UtcNow,
                        RoomId = !string.IsNullOrEmpty(roomid) ? int.Parse(roomid) : null,
                    };
                    chatMsgList.Add(danmaku);
                }
            }

            if (chatMsgList.Count > 0)
            {
                await _bufferSemaphore.WaitAsync();
                try
                {
                    _danmakuBuffer.AddRange(chatMsgList);

                    if (_danmakuBuffer.Count >= 20)
                    {
                        _flushTimer?.Dispose();
                        _flushTimer = null;
                        _ = Task.Run(async () => await FlushBufferAsync());
                    }
                    else if (_danmakuBuffer.Count == 1)
                    {
                        _flushTimer?.Dispose();
                        _flushTimer = new Timer(async _ =>
                        {
                            _ = Task.Run(async () => await FlushBufferAsync());
                        }, null, TimeSpan.FromSeconds(5), Timeout.InfiniteTimeSpan);
                    }
                }
                finally
                {
                    _bufferSemaphore.Release();
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while processing message for: [{ServerUrl}]", _serverUrl);
        }
    }

    private async Task FlushBufferAsync()
    {
        List<Danmaku> danmakusToSave = [];

        await _bufferSemaphore.WaitAsync();
        try
        {
            if (_danmakuBuffer.Count == 0)
            {
                return;
            }

            danmakusToSave = [.. _danmakuBuffer];
            _danmakuBuffer.Clear();
        }
        finally
        {
            _bufferSemaphore.Release();
        }

        if (danmakusToSave is not null && danmakusToSave.Count > 0)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                using var dbContext = scope.ServiceProvider.GetRequiredService<DyDanmakuDbContext>();
                await dbContext.Danmakus.AddRangeAsync(danmakusToSave);
                var savedRows = await dbContext.SaveChangesAsync();
                logger.LogInformation("Saved [{SavedRows}] chat message(s) to database for room [{RoomId}]", savedRows, RoomId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to save danmaku to database.");
            }
        }
    }

    private void Precheck()
    {
        var precheckMsg = "type@=unsub/mt@=dyh_legend_subscribe/";
        SendMsg(precheckMsg);
    }

    private void Login()
    {
        var loginMsg = $"type@=loginreq/roomid@={RoomId}/dfl@=sn@AA=106@ASss@AA=1@Ssn@AA=107@ASss@AA=1@Ssn@AA=108@ASss@AA=1@Ssn@AA=105@ASss@AA=1/username@=weibo_Fd5g4UoV/uid@=4845301/ver@=20220825/aver@=218101901/ct@=0/";
        SendMsg(loginMsg);
    }

    private async Task LogoutAsync()
    {
        if (_client?.State == WebSocketState.Open)
        {
            var logoutMsg = "type@=logout/";
            SendMsg(logoutMsg);
            await Task.Delay(100);
        }
    }

    private void JoinGroup()
    {
        var joinGroupMsg = $"type@=joingroup/rid@={RoomId}/gid@=1/";
        SendMsg(joinGroupMsg);
    }

    public void CloseGift()
    {
        var closeGiftMsg = "type@=dmfbdreq/dfl@=sn@AA=105@ASss@AA=1@AS@Ssn@AA=106@ASss@AA=1@AS@Ssn@AA=107@ASss@AA=1@AS@Ssn@AA=108@ASss@AA=1@AS@Ssn@AA=110@ASss@AA=1@AS@Ssn@AA=901@ASss@AA=1@AS@S/";
        SendMsg(closeGiftMsg);
    }

    private void StartHeartbeat()
    {
        SendMsg("type@=mrkl/");
        _heartbeatTimer = new Timer(
            (state) =>
            {
                if (_isConnected && _client?.State == WebSocketState.Open)
                {
                    SendMsg("type@=mrkl/");
                }
            },
            null,
            TimeSpan.FromSeconds(45),
            TimeSpan.FromSeconds(45)
        );
    }

    private void SendMsg(string msg)
    {
        if (_client?.State == WebSocketState.Open)
        {
            var msgBytes = MsgEncode(msg);
            _ = _client.SendAsync(new ArraySegment<byte>(msgBytes), WebSocketMessageType.Binary, true, _cancellationTokenSource?.Token ?? CancellationToken.None);
        }
    }

    private static byte[] MsgEncode(string msg)
    {
        // 消息以 \0 结尾
        msg += '\0';

        // 将字符串转换为UTF-8编码的字节数组
        var msgBuffer = Encoding.UTF8.GetBytes(msg);

        // 消息长度 + 头部长度8
        var length = msgBuffer.Length + 8;

        // 创建头部字节数组
        var headBuffer = new byte[12]; // 4+4+2+1+1=12

        // 写入消息长度（小端序）
        BitConverter.GetBytes(length).CopyTo(headBuffer, 0);
        BitConverter.GetBytes(length).CopyTo(headBuffer, 4);

        // 斗鱼客户端发送消息类型 689
        BitConverter.GetBytes((ushort)689).CopyTo(headBuffer, 8);

        // 加密字段与保留字段，默认 0
        headBuffer[10] = 0;
        headBuffer[11] = 0;

        // 合并头部和消息体
        var result = new byte[headBuffer.Length + msgBuffer.Length];
        headBuffer.CopyTo(result, 0);
        msgBuffer.CopyTo(result, headBuffer.Length);

        return result;
    }

    private static List<string> MsgDecode(byte[] msgBytes)
    {
        var messages = new List<string>();
        var buffer = msgBytes;
        int cursor = 0;

        while (cursor < buffer.Length)
        {
            // 读取4字节长度（小端序）
            if (cursor + 4 > buffer.Length) break;

            var contentLength = BitConverter.ToUInt32(buffer, cursor);

            // 计算内容起始位置：cursor+4+8
            var contentStart = cursor + 4 + 8;

            // 计算内容结束位置：cursor+4+content_length-1
            var contentEnd = cursor + 4 + contentLength - 1;

            // 检查边界
            if (contentEnd > buffer.Length) break;
            if (contentEnd <= contentStart)
            {
                cursor = cursor + 4 + (int)contentLength;
                continue;
            }

            // 提取并解码内容
            var content = new byte[contentEnd - contentStart];
            Array.Copy(buffer, contentStart, content, 0, content.Length);
            var decodedContent = Encoding.UTF8.GetString(content);

            messages.Add(decodedContent);

            // 移动游标
            cursor = cursor + 4 + (int)contentLength;
        }

        return messages;
    }

    private Dictionary<string, string>? MsgFormat(string msgStr)
    {
        try
        {
            var msgDict = new Dictionary<string, string>();
            var msgList = msgStr.Split('/').Where(item => !string.IsNullOrEmpty(item)).ToArray();

            foreach (var msg in msgList)
            {
                var processedMsg = msg.Replace("@s", "/").Replace("@A", "@");

                var msgTmp = processedMsg.Split(["@="], StringSplitOptions.None);

                if (msgTmp.Length == 2)
                {
                    msgDict[msgTmp[0]] = msgTmp[1];
                }
            }

            return msgDict;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while formatting message from: [{ServerUrl}]", _serverUrl);
            return null;
        }
    }
}

public static class CancellationTokenExtensions
{
    public static Task WhenCanceled(this CancellationToken cancellationToken)
    {
        var tcs = new TaskCompletionSource<bool>();
        cancellationToken.Register(s =>
        {
            if (s is TaskCompletionSource<bool> source)
            {
                source.SetResult(true);
            }
        }, tcs);
        return tcs.Task;
    }
}
