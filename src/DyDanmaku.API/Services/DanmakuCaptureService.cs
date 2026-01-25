using System.Text.Json;
using System.Text.Json.Serialization;

namespace DyDanmaku.API.Services;

internal class DanmakuCaptureService(
    DyDanmakuDbContext dbContext,
    DyDanmakuClient dyDanmakuClient,
    IHttpClientFactory httpClientFactory,
    ICaptureJobRepository captureJobService,
    IConfiguration configuration,
    ILogger<DanmakuCaptureService> logger) : IDanmakuCaptureService
{
    private int _duration;
    public int Duration { get => _duration; }
    private int _roomId;
    public int RoomId { get => _roomId; }
    private Action<int>? _onCaptureCompleted;

    public void SetCleanupCallback(Action<int> onCaptureCompleted)
    {
        _onCaptureCompleted = onCaptureCompleted;
    }

    public async Task Start(int roomId, int duration = 3600)
    {
        _roomId = roomId;
        _duration = duration;

        await UpdateRoomInfo(roomId);

        logger.LogInformation("Starting danmaku capture for [{RoomId}] - Duration: {Duration}s", _roomId, _duration);
        _ = await Task.Factory.StartNew(async () =>
        {
            try
            {
                await dyDanmakuClient.StartAsync(_roomId, _duration);
                
                // Capture completed naturally - update status and cleanup
                await captureJobService.UpdateJobStatusAsync(roomId, JobStatus.Completed);
                _onCaptureCompleted?.Invoke(roomId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during danmaku capture for room [{RoomId}]", _roomId);
                await captureJobService.UpdateJobStatusAsync(roomId, JobStatus.Failed);
                _onCaptureCompleted?.Invoke(roomId);
            }
        }, TaskCreationOptions.LongRunning);
    }

    public async Task Stop()
    {
        logger.LogInformation("Stopping danmaku capture for room [{RoomId}]", _roomId);
        await dyDanmakuClient.StopAsync();
        await captureJobService.UpdateJobStatusAsync(_roomId, JobStatus.Cancelled);
        _onCaptureCompleted?.Invoke(_roomId);
    }

    private async Task UpdateRoomInfo(int roomId)
    {
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
