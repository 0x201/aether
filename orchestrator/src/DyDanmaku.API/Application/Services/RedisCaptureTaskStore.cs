namespace DyDanmaku.API.Application.Services;

public class RedisCaptureTaskStore(
    IConnectionMultiplexer connectionMultiplexer,
    ILogger<RedisCaptureTaskStore> logger
) : ICaptureTaskStore
{
    private const string KeyPrefix = "capture:job:";
    
    private static string BuildKey(int roomId) => $"{KeyPrefix}{roomId}";


    public async Task<IReadOnlyList<CaptureTaskMetadata>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var results = new List<CaptureTaskMetadata>();

        try
        {
            var server = connectionMultiplexer.GetServer(connectionMultiplexer.GetEndPoints().First());
            var db = connectionMultiplexer.GetDatabase();

            await foreach (var key in server.KeysAsync(pattern: $"{KeyPrefix}*"))
            {
                var value = await db.StringGetAsync(key);
                if (value.IsNullOrEmpty)
                {
                    continue;
                }
                var metadata = JsonSerializer.Deserialize<CaptureTaskMetadata>(value.ToString());
                if (metadata is not null)
                {
                    results.Add(metadata);
                }
            }
        }
        catch (Exception ex)
        {
            logger.ZLogError($"Failed to retrieve capture task metadata from Redis. Exception: {ex}");
        }
        return results;
    }

    public async Task RemoveAsync(int roomId, CancellationToken cancellationToken = default)
    {
        var db = connectionMultiplexer.GetDatabase();
        await db.KeyDeleteAsync(BuildKey(roomId));
        logger.ZLogInformation($"Removed capture task metadata for room [{roomId}] from Redis");
    }

    public async Task SaveAsync(int roomId, CaptureTaskMetadata metadata, CancellationToken cancellationToken = default)
    {
        var db = connectionMultiplexer.GetDatabase();
        var key = BuildKey(roomId);
        var value = JsonSerializer.Serialize(metadata);
        var elapsed = DateTimeOffset.UtcNow - metadata.StartTime;
        var remaining = TimeSpan.FromSeconds(metadata.Duration) - elapsed;

        if (remaining <= TimeSpan.Zero)
        {
            logger.ZLogWarning($"Capture task for room [{roomId}] has already expired. Skipping Redis save");
            return;
        }

        await db.StringSetAsync(key, value, remaining);
        logger.ZLogInformation($"Saved capture task metadata for room [{roomId}] to Redis with TTL [{remaining.TotalSeconds:F0}s]");
    }
}
