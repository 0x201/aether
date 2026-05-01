namespace DyDanmaku.API.Application.Services;

public class DanmakuCaptureService(
    IServiceScopeFactory serviceScopeFactory,
    IMemoryTaskScheduler memoryTaskScheduler,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<DanmakuCaptureService> logger) : IDanmakuCaptureService
{
    private int? _currentRoomId;
    private string? _currentTaskId;
    private Func<int, JobStatus, Task>? _onCaptureCompleted;

    public void SetCleanupCallback(Func<int, JobStatus, Task> onCaptureCompleted)
    {
        _onCaptureCompleted = onCaptureCompleted;
    }

    public async Task StartAsync(int roomId, int duration = 3600)
    {
        if (_currentRoomId.HasValue)
        {
            logger.ZLogWarning($"A capture job for room [{roomId}] is already running");
            return;
        }

        var taskId = $"capture_{roomId}";
        _currentRoomId = roomId;
        _currentTaskId = taskId;

        await UpdateRoomInfo(roomId);

        logger.ZLogInformation($"Starting danmaku capture for [{roomId}] - Duration: {duration}s");

        var added = await memoryTaskScheduler.AddTaskAsync(taskId, async (cts) =>
        {
            var scope = serviceScopeFactory.CreateScope();
            var clientPool = scope.ServiceProvider.GetRequiredService<DyDanmakuClientPool>();

            await using var lease = await clientPool.RentAsync();
            var completionStatus = JobStatus.Failed;

            try
            {
                var completionCts = new CancellationTokenSource();
                var captureTask = lease.Client.StartAsync(roomId, duration, completionCts.Token);
                var completed = await Task.WhenAny(captureTask, Task.Delay(Timeout.InfiniteTimeSpan, cts));

                if (completed == captureTask)
                {
                    completionStatus = JobStatus.Completed;
                    logger.ZLogInformation($"Danmaku capture for room [{roomId}] completed normally");
                }
                else
                {
                    completionStatus = JobStatus.Cancelled;
                    logger.ZLogInformation($"Danmaku capture for room [{roomId}] was cancelled");
                }
            }
            catch (Exception ex)
            {
                completionStatus = JobStatus.Failed;
                logger.ZLogError($"An error occurred during danmaku capture for room [{roomId}]. Exception: {ex}");
            }
            finally
            {
                if (_currentRoomId == roomId)
                {
                    Reset();
                }
                scope.Dispose();

                if (_onCaptureCompleted is not null)
                {
                    await _onCaptureCompleted.Invoke(roomId, completionStatus);
                }
            }
        });

        if (!added)
        {
            logger.ZLogError($"Failed to add task to scheduler for room [{roomId}]");
            Reset();
        }
    }

    private void Reset()
    {
        _currentTaskId = null;
        _currentRoomId = null;
    }

    public async Task StopAsync()
    {
        if (_currentTaskId is not null && _currentRoomId.HasValue)
        {
            logger.ZLogInformation($"Stopping danmaku capture for room [{_currentRoomId}]");

            await memoryTaskScheduler.CancelTaskAsync(_currentTaskId);
        }
    }

    private async Task UpdateRoomInfo(int roomId)
    {
        using var scope = serviceScopeFactory.CreateScope();
        using var dbContext = scope.ServiceProvider.GetRequiredService<DyDanmakuDbContext>();
        var roomExists = await dbContext.Rooms.AnyAsync(x => x.RoomId == roomId);
        if (!roomExists)
        {
            var roomUserInfo = await GetAnchorInfo(roomId);
            if (roomUserInfo is not null)
            {
                var roomName = roomUserInfo.Data?.AnchorInfo?.Nickname ?? "Unknown";
                dbContext.Rooms.Add(new Room
                {
                    RoomId = roomId,
                    RoomName = roomName,
                    CreatedAt = DateTimeOffset.UtcNow
                });
                await dbContext.SaveChangesAsync();
                logger.ZLogInformation($"Added new room [{roomName}({roomId})] to database");
            }
        }
    }

    private async Task<RoomUserInfoDto?> GetAnchorInfo(int roomId)
    {
        var url = $"{configuration.GetSection("Douyu:Apis:RoomUserInfoEndpoint").Get<string>()}{roomId}";
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);

        try
        {
            var response = await client.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var roomUserInfoDto = JsonSerializer.Deserialize<RoomUserInfoDto>(content);
                return roomUserInfoDto;
            }
        }
        catch (Exception ex)
        {
            logger.ZLogError($"An error occurred while getting room info for room {roomId}. Exception: {ex}");
        }
        return null;
    }
}

class RoomUserInfoDto
{
    [JsonPropertyName("error")]
    public int Error { get; set; }

    [JsonPropertyName("data")]
    public DataInfo? Data { get; set; }

    [JsonPropertyName("msg")]
    public string? Msg { get; set; }
}

class DataInfo
{
    [JsonPropertyName("userType")]
    public int UserType { get; set; }

    [JsonPropertyName("currAuthStatus")]
    public int CurrAuthStatus { get; set; }

    [JsonPropertyName("ridAuthStatus")]
    public int RidAuthStatus { get; set; }

    [JsonPropertyName("userInfo")]
    public UserInfo? UserInfo { get; set; }

    [JsonPropertyName("anchorInfo")]
    public AnchorInfo? AnchorInfo { get; set; }
}

class UserInfo
{
    [JsonPropertyName("hashId")]
    public string? HashId { get; set; }

    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }
}

class AnchorInfo
{
    [JsonPropertyName("rid")]
    public int Rid { get; set; }

    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }
}