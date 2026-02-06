namespace DyDanmaku.API.Application.Services;

public class DanmakuCaptureService(
    IServiceProvider serviceProvider,
    IMemoryTaskScheduler memoryTaskScheduler,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<DanmakuCaptureService> logger) : IDanmakuCaptureService
{
    private int? _currentRoomId;
    private string? _currentTaskId;
    private Action<int>? _onCaptureCompleted;

    public void SetCleanupCallback(Action<int> onCaptureCompleted)
    {
        _onCaptureCompleted = onCaptureCompleted;
    }

    public async Task StartAsync(int roomId, int duration = 3600)
    {
        if (_currentRoomId.HasValue)
        {
            logger.LogWarning("A capture job for room [{RoomId}] is already running", roomId);
            return;
        }

        var taskId = $"capture_{roomId}";
        _currentRoomId = roomId;
        _currentTaskId = taskId;

        await UpdateRoomInfo(roomId);

        logger.LogInformation("Starting danmaku capture for [{RoomId}] - Duration: {Duration}s", roomId, duration);

        var added = await memoryTaskScheduler.AddTaskAsync(taskId, async (cts) =>
        {
            var scope = serviceProvider.CreateScope();
            var clientPool = scope.ServiceProvider.GetRequiredService<DyDanmakuClientPool>();

            DyDanmakuClient scopedClient = await clientPool.RentAsync();
            var innerCaptureJobService = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();

            try
            {
                await scopedClient.StartAsync(roomId, duration, cts);

                await innerCaptureJobService.UpdateJobStatusAsync(roomId, JobStatus.Completed);
                logger.LogInformation("Danmaku capture for room [{RoomId}] completed normally", roomId);
            }
            catch (OperationCanceledException)
            {
                await innerCaptureJobService.UpdateJobStatusAsync(roomId, JobStatus.Cancelled);
                logger.LogInformation("Danmaku capture for room [{RoomId}] was cancelled", roomId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during danmaku capture for room [{RoomId}]", roomId);
                await innerCaptureJobService.UpdateJobStatusAsync(roomId, JobStatus.Failed);
            }
            finally
            {
                if (clientPool is not null)
                {
                    clientPool.ReturnClient(scopedClient);
                }
                else
                {
                    scopedClient?.Dispose();
                }

                if (_currentRoomId == roomId)
                {
                    Reset();
                }

                _onCaptureCompleted?.Invoke(roomId);
            }
        });

        if (!added)
        {
            logger.LogError("Failed to add task to scheduler for room [{RoomId}]", roomId);
            Reset();
            return;
        }
        using var scope = serviceProvider.CreateScope();
        var scopedCaptureJobService = scope.ServiceProvider.GetRequiredService<ICaptureJobRepository>();
        await scopedCaptureJobService.CreateJobAsync(roomId, duration);
    }

    private void Reset()
    {
        _currentTaskId = null;
        _currentRoomId = null;
    }

    public async Task StopAsync()
    {
        if (_currentTaskId != null && _currentRoomId.HasValue)
        {
            logger.LogInformation("Stopping danmaku capture for room [{RoomId}]", _currentRoomId);

            await memoryTaskScheduler.CancelTaskAsync(_currentTaskId);
        }
    }

    private async Task UpdateRoomInfo(int roomId)
    {
        using var scope = serviceProvider.CreateScope();
        using var dbContext = scope.ServiceProvider.GetRequiredService<DyDanmakuDbContext>();
        var roomExists = await dbContext.Rooms.AnyAsync(x => x.RoomId == roomId);
        if (!roomExists)
        {
            var roomUserInfo = await GetAnchorInfo(roomId);
            if (roomUserInfo is not null)
            {
                dbContext.Rooms.Add(new Room
                {
                    RoomId = roomId,
                    RoomName = roomUserInfo.Data?.AnchorInfo?.Nickname ?? "Unknown",
                    CreatedAt = DateTimeOffset.UtcNow
                });
                await dbContext.SaveChangesAsync();
                logger.LogInformation("Added new room [{RoomId}] to database", roomId);
            }
        }
    }

    private async Task<RoomUserInfoDto?> GetAnchorInfo(int roomId)
    {
        var url = $"{configuration.GetSection("Douyu:Apis:RoomUserInfoEndpoint").Get<string>()}{roomId}";
        var client = httpClientFactory.CreateClient();
        var response = await client.GetAsync(url);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            var roomUserInfoDto = JsonSerializer.Deserialize<RoomUserInfoDto>(content);
            return roomUserInfoDto;
        }

        logger.LogWarning("Error getting anchor info for room {RoomId}", roomId);
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