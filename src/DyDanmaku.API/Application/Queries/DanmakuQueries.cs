namespace DyDanmaku.API.Application.Queries;

public class DanmakuQueries(
    DyDanmakuDbContext dbContext,
    IConnectionMultiplexer cache,
    ILogger<DanmakuQueries> logger) : IDanmakuQueries
{
    public async Task<Result<IReadOnlyList<WordFrequency>>> GetAnalysisData(DanmakuAnalysisRequest request, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<WordFrequency> wordFrequencies = [];
        var cacheKey =GenerateCacheKey("danmaku_analysis", request.StartTime, request.EndTime, request.RoomId);
        var cacheValue = await cache.GetDatabase().StringGetAsync(cacheKey);

        if (cacheValue.HasValue)
        {
            var cachedAnalysis = JsonSerializer.Deserialize(cacheValue.ToString(), DanmakuJsonSerializerContext.Default.DanmakuAnalysis);
            if (cachedAnalysis is not null && cachedAnalysis.Frequencies is not null)
            {
                wordFrequencies = ParseFrequenciesFromNestedArray(cachedAnalysis.Frequencies, request.TopN);
                return Result<IReadOnlyList<WordFrequency>>.Success(wordFrequencies);
            }
        }

        var danmakuAnalysis = await dbContext.DanmakuAnalyses
            .AsNoTracking()
            .WhereIf(request.StartTime.HasValue, x => x.StartTime >= request.StartTime)
            .WhereIf(request.EndTime.HasValue, x => x.EndTime <= request.EndTime)
            .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
            .WhereIf(!request.RoomId.HasValue, x => x.RoomId == null)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (danmakuAnalysis is not null)
        {
            try
            {
                wordFrequencies = string.IsNullOrEmpty(danmakuAnalysis.Frequencies)
                    ? []
                    : ParseFrequenciesFromNestedArray(danmakuAnalysis.Frequencies, request.TopN);
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Error deserializing word frequencies");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error parsing word frequencies");
            }
        }

        var res = Result<IReadOnlyList<WordFrequency>>.Success(wordFrequencies);
        return res;
    }

    public async Task<PagedListResult<CaptureJobDto>> GetPagedCaptureJobs(CaptureJobRequest request, CancellationToken cancellationToken = default)
    {
        var query = dbContext.CaptureJobs
                .AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);

        if (!string.IsNullOrEmpty(request.Sorter))
        {
            query = query.OrderBy(request.Sorter);
        }
        else
        {
            query = query.OrderByDescending(x => x.Id);
        }

        var jobs = await query
            .PagedBy(request.Page, request.PageSize)
            .ToListAsync();

        var res = PagedListResult<CaptureJobDto>.Success(CaptureJobMapping.MapToDtos(jobs), totalCount);
        return res;
    }

    public async Task<PagedListResult<DanmakuWithRoom>> GetPagedList(CaptureJobRequest request, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Danmakus
                .AsNoTracking()
                .WhereIf(!string.IsNullOrEmpty(request.UserName), d => d.UserName!.Equals(request.UserName!))
                .WhereIf(!string.IsNullOrEmpty(request.Content), d => d.Content!.Equals(request.Content!))
                .WhereIf(request.RoomId.HasValue, d => d.RoomId == request.RoomId)
                .WhereIf(request.StartTime.HasValue, d => d.CreatedAt >= request.StartTime)
                .WhereIf(request.EndTime.HasValue, d => d.CreatedAt <= request.EndTime)
                .Join(
                    dbContext.Rooms.AsNoTracking(),
                    d => d.RoomId,
                    r => r.RoomId,
                    (d, r) => new DanmakuWithRoom
                    {
                        Id = d.Id,
                        UserId = d.UserId,
                        UserName = d.UserName,
                        Content = d.Content,
                        FanMedalName = d.FanMedalName,
                        FanMedalLevel = d.FanMedalLevel,
                        UserLevel = d.UserLevel,
                        CreatedAt = d.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"),
                        RoomId = d.RoomId,
                        RoomName = r.RoomName
                    });

        var totalCount = await query.CountAsync(cancellationToken);

        if (!string.IsNullOrEmpty(request.Sorter))
        {
            query = query.OrderBy(request.Sorter);
        }
        else
        {
            query = query.OrderByDescending(x => x.Id);
        }

        var danmakus = await query
            .PagedBy(request.Page, request.PageSize)
            .ToListAsync(cancellationToken);

        var res = PagedListResult<DanmakuWithRoom>.Success(danmakus, totalCount);
        return res;
    }

    public async Task<PagedListResult<RoomDto>> GetPagedRooms(RoomRequest request, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Rooms
                .AsNoTracking()
                .WhereIf(!string.IsNullOrEmpty(request.RoomName), d => d.RoomName!.Contains(request.RoomName!))
                .WhereIf(request.RoomId.HasValue, d => d.RoomId == request.RoomId);

        var totalCount = await query.CountAsync();

        var rooms = await query
            .OrderByDescending(x => x.RoomId)
            .PagedBy(request.Page, request.PageSize)
            .ToListAsync();

        var res = PagedListResult<RoomDto>.Success(RoomMapping.MapToDtos(rooms), totalCount);
        return res;
    }
    
    public async Task<Result<DanmakuStats>> GetDanmakuStats(DanmakuAnalysisRequest request, CancellationToken cancellationToken = default)
    {
        var cacheKey = GenerateCacheKey("danmaku_stats", request.StartTime, request.EndTime, request.RoomId);

        var cacheValue = await cache.GetDatabase().StringGetAsync(cacheKey);

        if (cacheValue.HasValue)
        {
            var cachedStats = JsonSerializer.Deserialize(cacheValue.ToString(), DanmakuJsonSerializerContext.Default.DanmakuStats);
            if (cachedStats is not null)
                return Result<DanmakuStats>.Success(cachedStats);
        }

        var totalCount = await dbContext.Danmakus
            .WhereIf(request.StartTime.HasValue, x => x.CreatedAt >= request.StartTime)
            .WhereIf(request.EndTime.HasValue, x => x.CreatedAt <= request.EndTime)
            .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
            .CountAsync(cancellationToken);

        var uniqueUsers = await dbContext.Danmakus
            .AsNoTracking()
            .WhereIf(request.StartTime.HasValue, x => x.CreatedAt >= request.StartTime)
            .WhereIf(request.EndTime.HasValue, x => x.CreatedAt <= request.EndTime)
            .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
            .GroupBy(x => x.UserId)
            .CountAsync(cancellationToken);

        var topUsers = await dbContext.Danmakus
            .AsNoTracking()
            .WhereIf(request.StartTime.HasValue, x => x.CreatedAt >= request.StartTime)
            .WhereIf(request.EndTime.HasValue, x => x.CreatedAt <= request.EndTime)
            .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
            .GroupBy(x => new { x.UserId, x.UserName })
            .Select(x => new TopUser
            {
                UserName = x.Key.UserName,
                Count = x.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync(cancellationToken);

        var danmakusForHourlyDistribution = await dbContext.Danmakus
            .AsNoTracking()
            .WhereIf(request.StartTime.HasValue, x => x.CreatedAt >= request.StartTime)
            .WhereIf(request.EndTime.HasValue, x => x.CreatedAt <= request.EndTime)
            .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
            .Select(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var hourlyDistributions = danmakusForHourlyDistribution
            .GroupBy(x => x.ToLocalTime().Hour)
            .Select(x => new HourlyDistribution
            {
                Hour = x.Key.ToString(),
                Count = x.Count()
            })
            .OrderBy(x => x.Hour)
            .ToList();

        var topRoomsQuery = dbContext.Danmakus
            .AsNoTracking()
            .WhereIf(request.StartTime.HasValue, x => x.CreatedAt >= request.StartTime)
            .WhereIf(request.EndTime.HasValue, x => x.CreatedAt <= request.EndTime)
            .GroupBy(x => new { x.RoomId })
            .Select(x => new
            {
                x.Key.RoomId,
                Count = x.Count(),
            });
        var topRooms = await topRoomsQuery
            .Join(
                dbContext.Rooms.AsNoTracking(),
                d => d.RoomId,
                r => r.RoomId,
                (d, r) => new TopRoom
                {
                    RoomId = d.RoomId.GetValueOrDefault(),
                    Count = d.Count,
                    RoomName = r.RoomName,
                }
            )
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync(cancellationToken);

        var stats = new DanmakuStats
        {
            TotalCount = totalCount,
            UniqueUsers = uniqueUsers,
            TopUsers = topUsers,
            HourlyDistributions = hourlyDistributions,
            TopRooms = topRooms,
        };

        await cache.GetDatabase().StringSetAsync(
            key: cacheKey,
            value: JsonSerializer.Serialize(stats, DanmakuJsonSerializerContext.Default.DanmakuStats),
            expiry: TimeSpan.FromHours(1));


        var res = Result<DanmakuStats>.Success(stats);
        return res;
    }

    public async Task<Result<DataCount>> GetDanmakuCount(CancellationToken cancellationToken = default)
    {
        var danamkuCount = await dbContext.Danmakus.AsNoTracking().CountAsync(cancellationToken);
        var roomCount = await dbContext.Rooms.AsNoTracking().CountAsync(cancellationToken);
        var userCount = await dbContext.Danmakus.AsNoTracking().Select(d => d.UserId).Distinct().CountAsync(cancellationToken);
        var res = new DataCount(danamkuCount, roomCount, userCount);
        return Result<DataCount>.Success(res);
    }

    public async Task<Result<CaptureJobDto>> GetActiveJob(int roomId, CancellationToken cancellationToken = default)
    {
        var job = await dbContext.CaptureJobs
            .FirstOrDefaultAsync(j => j.RoomId == roomId && j.Status == JobStatus.Running.ToString(), cancellationToken);

        var dto = job is null ? null : new CaptureJobDto(
            job.Id,
            job.RoomId,
            job.Duration,
            job.Status,
            job.StartTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            job.EndTime?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            job.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
        );
        if (dto is null)
        {
            return Result<CaptureJobDto>.Failure(HttpStatusCode.NotFound, "No active job found", null);
        }
        return Result<CaptureJobDto>.Success(dto);
    }

    static List<WordFrequency> ParseFrequenciesFromNestedArray(string frequenciesJson, int? topN)
    {
        using var jsonDoc = JsonDocument.Parse(frequenciesJson);
        var jsonArray = jsonDoc.RootElement;

        if (jsonArray.ValueKind != JsonValueKind.Array)
            return [];
        var count = topN.GetValueOrDefault(20);
        var result = new List<WordFrequency>(count);

        foreach (var item in jsonArray.EnumerateArray().Take(count))
        {
            if (item.GetArrayLength() >= 2)
            {
                var word = item[0].GetString() ?? string.Empty;
                var wordCount = item[1].GetInt32();

                result.Add(new WordFrequency
                {
                    Word = word,
                    Count = wordCount
                });
            }
        }
        return result;
    }

    static string GenerateCacheKey(string keyPrefix, DateTimeOffset? startDateTime, DateTimeOffset? endDateTime, int? roomId)
    {
        var dateFormat = "yyyy_MM_dd_HH_mm_ss";
        var roomIdStr = roomId.HasValue ? roomId.ToString() : "All";
        var cacheKey = $"{keyPrefix}:{startDateTime?.ToString(dateFormat)}:{endDateTime?.ToString(dateFormat)}:{roomIdStr}";
        return cacheKey;
    }
}
