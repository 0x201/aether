using System.Net;
using System.Text.Json;

using Asp.Versioning;

using DyDanmaku.API.Mappings;

internal static class DanmakuApi
{
    // Dictionary to store service instances and room info for each capture
    internal static ConcurrentDictionary<int, IDanmakuCaptureService> CaptureServices = [];
    private const string LogCategory = "DanmakuAPI";

    internal static void MapDanmakuApi(this IEndpointRouteBuilder app)
    {
        var apiVersionSet = app.NewApiVersionSet()
            .HasApiVersion(new ApiVersion(1))
            .HasApiVersion(new ApiVersion(2))
            .Build();

        var group = app.MapGroup("v{version:apiVersion}/danmakus")
            .WithApiVersionSet(apiVersionSet)
            .MapToApiVersion(1)
            .MapToApiVersion(2)
            .WithTags("Danmaku");

        group.MapPost("/capture/start", async (
            [FromBody] CaptureRequest request,
            [FromServices] ICaptureJobManager jobManager,
            [FromServices] DyDanmakuDbContext dbContext) =>
        {
            var success = await jobManager.StartAsync(request.RoomId, request.Duration);

            if (!success)
            {
                return Results.Conflict(Result.Failure(HttpStatusCode.Conflict, "A capture is already in progress for this room"));
            }

            var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.RoomId == request.RoomId);

            var roomDto = new RoomDto
            {
                RoomId = room!.RoomId,
                AnchorName = room.RoomName,
            };

            return Results.Ok(Result<RoomDto>.Success(roomDto, "Capture started"));
        })
        .WithName("StartCapture")
        .WithDescription("Starts a new danmaku capture session for the specified room")
        .WithSummary("Starts danmaku capture")
        .Produces<Result<RoomDto>>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/capture/stop", async (
            [FromBody] CaptureStopRequest request,
            [FromServices] ICaptureJobManager jobManager) =>
        {
            var success = await jobManager.StopAsync(request.RoomId);

            if (success)
            {
                return Results.Ok(Result.Success($"Capture stopped for room {request.RoomId}"));
            }
            else
            {
                return Results.NotFound(Result.Failure(HttpStatusCode.NotFound, $"No active capture found for room {request.RoomId}"));
            }
        })
        .WithName("StopCapture")
        .WithDescription("Stops an active danmaku capture session for the specified room")
        .WithSummary("Stops danmaku capture")
        .Produces<Result>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status404NotFound);

        group.MapGet("/count", async ([FromServices] DyDanmakuDbContext dbContext) =>
        {
            var danamkuCount = await dbContext.Danmakus.AsNoTracking().CountAsync();
            var roomCount = await dbContext.Rooms.AsNoTracking().CountAsync();
            var userCount = await dbContext.Danmakus.AsNoTracking().Select(d => d.UserId).Distinct().CountAsync();
            var count = new DataCount(danamkuCount, roomCount, userCount);
            return Results.Ok(Result<DataCount>.Success(count));
        })
        .WithName("GetDataCount")
        .WithDescription("Returns the count of all data in the database")
        .WithSummary("Get count of data")
        .Produces<Result<DataCount>>(StatusCodes.Status200OK);

        group.MapGet("", async (
            [AsParameters] DanmakuRequest request,
            [FromServices] DyDanmakuDbContext dbContext) =>
        {
            var query = dbContext.Danmakus
                .AsNoTracking()
                .WhereIf(!string.IsNullOrEmpty(request.UserName), d => d.UserName!.Contains(request.UserName!))
                .WhereIf(!string.IsNullOrEmpty(request.Content), d => d.Content!.Contains(request.Content!))
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

            var totalCount = await query.CountAsync();

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
                .ToListAsync();

            var res = PagedListResult<DanmakuWithRoom>.Success(danmakus, totalCount);
            return Results.Ok(res);
        })
        .WithName("DanmakuPagedList")
        .WithDescription("Returns a paged list of danmakus")
        .WithSummary("Paged list of danmakus")
        .Produces<PagedListResult<DanmakuWithRoom>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status404NotFound);

        group.MapGet("/rooms", async (
            [AsParameters] RoomRequest request,
            [FromServices] DyDanmakuDbContext dbContext) =>
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
            return Results.Ok(res);
        })
        .WithName("RoomPagedList")
        .WithDescription("Returns a paged list of rooms")
        .WithSummary("Paged list of rooms")
        .Produces<PagedListResult<RoomDto>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:int}", async (
            [FromRoute] int id,
            [FromServices] DyDanmakuDbContext dbContext) =>
        {
            var entity = await dbContext.Danmakus.FindAsync(id);
            if (entity is null)
            {
                return Results.NotFound(Result.Failure(HttpStatusCode.NotFound, $" Not found Danmaku: [{id}]"));
            }
            dbContext.Remove(entity);
            await dbContext.SaveChangesAsync();
            return Results.Ok(Result.Success("Deleted"));
        })
        .WithName("DeleteDanmaku")
        .WithDescription("Delete a danmaku by ID")
        .WithSummary("Delete danmaku");

        group.MapGet("/capture/jobs", async (
            [AsParameters] DanmakuRequest request,
            [FromServices] DyDanmakuDbContext dbContext) =>
        {
            var query = dbContext.CaptureJobs
                .AsNoTracking();

            var totalCount = await query.CountAsync();

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
            return Results.Ok(res);
        })
        .WithName("CaptureJobPagedList")
        .WithDescription("Returns a paged list of capture jobs")
        .WithSummary("Paged list of capture jobs")
        .Produces<PagedListResult<CaptureJobDto>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status404NotFound);

        group.MapGet("/analysis-data", async (
            [AsParameters] DanmakuAnalysisRequest request,
            [FromServices] DyDanmakuDbContext dbContext,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger(LogCategory);

            IReadOnlyList<WordFrequency> wordFrequencies = [];

            var danmakuAnalysis = await dbContext.DanmakuAnalyses
                .AsNoTracking()
                .WhereIf(request.StartTime.HasValue, x => x.StartTime >= request.StartTime)
                .WhereIf(request.EndTime.HasValue, x => x.EndTime <= request.EndTime)
                .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
                .WhereIf(!request.RoomId.HasValue, x => x.RoomId == null)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

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
            return Results.Ok(res);
        })
        .WithName("DanmakuAnalysisData")
        .WithDescription("Returns danmaku analysis data")
        .WithSummary("Danmaku analysis data")
        .Produces<IReadOnlyList<WordFrequency>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status404NotFound);

        group.MapGet("/stats", async (
            [AsParameters] DanmakuAnalysisRequest request,
            [FromServices] DyDanmakuDbContext dbContext) =>
        {
            var totalCount = await dbContext.Danmakus
                .WhereIf(request.StartTime.HasValue, x => x.CreatedAt >= request.StartTime)
                .WhereIf(request.EndTime.HasValue, x => x.CreatedAt <= request.EndTime)
                .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
                .CountAsync();

            var uniqueUsers = await dbContext.Danmakus
                .AsNoTracking()
                .WhereIf(request.StartTime.HasValue, x => x.CreatedAt >= request.StartTime)
                .WhereIf(request.EndTime.HasValue, x => x.CreatedAt <= request.EndTime)
                .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
                .GroupBy(x => x.UserId)
                .CountAsync();

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
                .ToListAsync();

            var danmakusForHourlyDistribution = await dbContext.Danmakus
                .AsNoTracking()
                .WhereIf(request.StartTime.HasValue, x => x.CreatedAt >= request.StartTime)
                .WhereIf(request.EndTime.HasValue, x => x.CreatedAt <= request.EndTime)
                .WhereIf(request.RoomId.HasValue, x => x.RoomId == request.RoomId)
                .Select(x => x.CreatedAt)
                .ToListAsync();

            var hourlyDistributions = danmakusForHourlyDistribution
                .GroupBy(x => x.ToLocalTime().Hour)
                .Select(x => new HourlyDistribution
                {
                    Hour = x.Key.ToString(),
                    Count = x.Count()
                })
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
                .ToListAsync();

            var stats = new DanmakuStats
            {
                TotalCount = totalCount,
                UniqueUsers = uniqueUsers,
                TopUsers = topUsers,
                HourlyDistributions = hourlyDistributions,
                TopRooms = topRooms,
            };


            var res = Result<DanmakuStats>.Success(stats);
            return Results.Ok(res);
        })
        .WithName("DanmakuStats")
        .WithDescription("Returns danmaku stats")
        .WithSummary("Danmaku stats")
        .Produces<DanmakuStats>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status404NotFound);

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
    }
}
