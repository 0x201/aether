internal static class DanmakuApi
{
    internal static RouteGroupBuilder MapDanmakuApi(this IEndpointRouteBuilder app)
    {
        var apiVersionSet = app.NewApiVersionSet()
            .HasApiVersion(new ApiVersion(1))
            .HasApiVersion(new ApiVersion(2))
            .Build();

        var api = app.MapGroup("v{version:apiVersion}/danmakus")
            .WithApiVersionSet(apiVersionSet)
            .MapToApiVersion(1)
            .MapToApiVersion(2)
            .WithTags("Danmaku");

        api.MapPost("/capture/start", StartCaptureAsync)
        .WithName("StartCapture")
        .WithDescription("Starts a new danmaku capture session for the specified room")
        .WithSummary("Starts danmaku capture")
        .Produces<Result<RoomDto>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status409Conflict)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapPost("/capture/stop", StopCaptureAsync)
        .WithName("StopCapture")
        .WithDescription("Stops an active danmaku capture session for the specified room")
        .WithSummary("Stops danmaku capture")
        .Produces<Result>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<Result>(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapGet("/count", GetDataCountAsync)
        .WithName("GetDataCount")
        .WithDescription("Returns the count of all data in the database")
        .WithSummary("Get count of data")
        .Produces<Result<DataCount>>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapGet("", GetDanmakusAsync)
        .WithName("DanmakuPagedList")
        .WithDescription("Returns a paged list of danmakus")
        .WithSummary("Paged list of danmakus")
        .Produces<PagedListResult<DanmakuWithRoom>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapGet("/rooms", GetRoomsAsync)
        .WithName("RoomPagedList")
        .WithDescription("Returns a paged list of rooms")
        .WithSummary("Paged list of rooms")
        .Produces<PagedListResult<RoomDto>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapGet("/capture/jobs", GetCaptureJobsAsync)
        .WithName("CaptureJobPagedList")
        .WithDescription("Returns a paged list of capture jobs")
        .WithSummary("Paged list of capture jobs")
        .Produces<PagedListResult<CaptureJobDto>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapDelete("/{id:int}", DeleteDanmakuAsync)
        .WithName("DeleteDanmaku")
        .WithDescription("Delete a danmaku by ID")
        .WithSummary("Delete danmaku")
        .Produces<NoContent>(StatusCodes.Status204NoContent)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapGet("/analysis-data", GetDanmakuAnalysisDataAsync)
        .WithName("DanmakuAnalysisData")
        .WithDescription("Returns danmaku analysis data")
        .WithSummary("Danmaku analysis data")
        .Produces<Result<IReadOnlyList<WordFrequency>>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapGet("/stats", GetDanmakuStatsAsync)
        .WithName("DanmakuStats")
        .WithDescription("Returns danmaku stats")
        .WithSummary("Danmaku stats")
        .Produces<Result<DanmakuStats>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        api.MapGet("/active-job", GetActiveJobAsync)
        .WithName("ActiveJob")
        .WithDescription("Returns active job")
        .WithSummary("Active capture job")
        .Produces<Result<CaptureJobDto>>(StatusCodes.Status200OK)
        .Produces<Result>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return api;
    }

    static async Task<Results<Ok<Result<RoomDto>>, BadRequest<Result>, Conflict<Result>, ProblemHttpResult>> StartCaptureAsync(
            [FromBody] CaptureRequest request,
            [AsParameters] DanmakuServices service)
    {
        if (request.RoomId <= 0 || request.Duration <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid room ID or duration"));
        }

        var res = await service.Mediator.Send(new StartCaptureJobCommand
        {
            RoomId = request.RoomId,
            Duration = request.Duration
        });

        if (res.Status != HttpStatusCode.OK || res.Data is null)
        {
            return TypedResults.Conflict(Result.Failure(HttpStatusCode.Conflict, "A capture is already in progress for this room"));
        }
        return TypedResults.Ok(res);
    }

    static async Task<Results<Ok<Result>, BadRequest<Result>, NotFound<Result>, ProblemHttpResult>> StopCaptureAsync(
            [FromBody] CaptureStopRequest request,
            [AsParameters] DanmakuServices service)
    {
        if (request.RoomId <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid room ID"));
        }


        var success = await service.Mediator.Send(new StopCaptureJobCommand
        {
            RoomId = request.RoomId
        });

        if (success)
        {
            return TypedResults.Ok(Result.Success($"Capture stopped for room {request.RoomId}"));
        }
        else
        {
            return TypedResults.NotFound(Result.Failure(HttpStatusCode.NotFound, $"No active capture found for room {request.RoomId}"));
        }
    }

    static async Task<Results<Ok<Result<DataCount>>, ProblemHttpResult>> GetDataCountAsync(
            [AsParameters] DanmakuServices service)
    {
        var res = await service.Queries.GetDanmakuCount();
        return TypedResults.Ok(res);
    }

    static async Task<Results<Ok<PagedListResult<DanmakuWithRoom>>, BadRequest<Result>, ProblemHttpResult>> GetDanmakusAsync(
            [AsParameters] CaptureJobRequest request,
            [AsParameters] DanmakuServices service)
    {
        if (request.Page <= 0 || request.PageSize <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid page or page size"));
        }

        if (request.StartTime.HasValue && request.EndTime.HasValue && request.StartTime > request.EndTime)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid time range"));
        }

        if (request.RoomId.HasValue && request.RoomId <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid room ID"));
        }

        var res = await service.Queries.GetPagedList(request);
        return TypedResults.Ok(res);
    }

    static async Task<Results<Ok<PagedListResult<RoomDto>>, BadRequest<Result>, ProblemHttpResult>> GetRoomsAsync(
            [AsParameters] RoomRequest request,
            [AsParameters] DanmakuServices service)
    {
        if (request.Page <= 0 || request.PageSize <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid page or page size"));
        }

        if (request.RoomId.HasValue && request.RoomId <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid room ID"));
        }
        var res = await service.Queries.GetPagedRooms(request);
        return TypedResults.Ok(res);
    }

    static async Task<Results<Ok<PagedListResult<CaptureJobDto>>, BadRequest<Result>, ProblemHttpResult>> GetCaptureJobsAsync(
            [AsParameters] CaptureJobRequest request,
            [AsParameters] DanmakuServices service)
    {
        if (request.Page <= 0 || request.PageSize <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid page or page size"));
        }

        if (request.RoomId.HasValue && request.RoomId <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid room ID"));
        }
        var res = await service.Queries.GetPagedCaptureJobs(request);
        return TypedResults.Ok(res);
    }


    static async Task<Results<Ok<Result<IReadOnlyList<WordFrequency>>>, BadRequest<Result>, ProblemHttpResult>> GetDanmakuAnalysisDataAsync(
            [AsParameters] DanmakuAnalysisRequest request,
            [AsParameters] DanmakuServices service)
    {
        if (request.TopN.HasValue && request.TopN <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid page or TopN"));
        }

        if (request.RoomId.HasValue && request.RoomId <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid room ID"));
        }
        var res = await service.Queries.GetAnalysisData(request);
        return TypedResults.Ok(res);
    }


    static async Task<Results<Ok<Result<DanmakuStats>>, BadRequest<Result>, ProblemHttpResult>> GetDanmakuStatsAsync(
            [AsParameters] DanmakuAnalysisRequest request,
            [AsParameters] DanmakuServices service)
    {
        if (request.TopN.HasValue && request.TopN <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid page or TopN"));
        }

        if (request.RoomId.HasValue && request.RoomId <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid room ID"));
        }
        var res = await service.Queries.GetDanmakuStats(request);
        return TypedResults.Ok(res);
    }

    static async Task<Results<NoContent, BadRequest<Result>, NotFound<Result>, ProblemHttpResult>> DeleteDanmakuAsync(
            [FromRoute] int id,
            [AsParameters] DanmakuServices service)
    {
        if (id <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid danmaku ID"));
        }

        var success = await service.Mediator.Send(new DeleteDanmakuCommand { Id = id });

        if (!success)
        {
            return TypedResults.NotFound(Result.Failure(HttpStatusCode.NotFound, "Danmaku not found"));
        }
        return TypedResults.NoContent();
    }

    static async Task<Results<Ok<Result<CaptureJobDto>>, BadRequest<Result>, NotFound<Result>, ProblemHttpResult>> GetActiveJobAsync(
            [FromQuery] int roomId,
            [AsParameters] DanmakuServices service)
    {
        if (roomId <= 0)
        {
            return TypedResults.BadRequest(Result.Failure(HttpStatusCode.BadRequest, "Invalid room ID"));
        }

        var res = await service.Queries.GetActiveJob(roomId);

        if (res.Status != HttpStatusCode.OK)
        {
            return TypedResults.NotFound(Result.Failure(HttpStatusCode.NotFound, "Room not found"));
        }

        return TypedResults.Ok(res);
    }
}
