"""弹幕模块 HTTP 路由。

路由函数只做三件事：解析/校验入参 → 调用应用层 → 转换响应。
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Body, HTTPException, Query

from src.api.dependencies import (
    DanmakuStatisticsHandlerDep,
    GenerateAnalysisHandlerDep,
    ListDanmakuHandlerDep,
    PrecomputeAllRoomsHandlerDep,
    WordcloudHandlerDep,
    WordFrequencyHandlerDep,
)
from src.api.schemas import (
    AnalysisGenerateRequest,
    DanmakuAnalysisResponse,
    DanmakuItemDto,
    DanmakuListResponse,
    DanmakuStatisticsResponse,
    WordcloudResponse,
    WordcloudWordDto,
    WordFrequencyItemDto,
    WordFrequencyResponse,
)
from src.application.danmaku.commands import (
    GenerateAnalysisCommand,
    PrecomputeAllRoomsCommand,
)
from src.application.danmaku.queries import (
    GetDanmakuStatisticsQuery,
    GetWordcloudQuery,
    GetWordFrequencyQuery,
    ListDanmakuQuery,
)
from src.domain.danmaku.services import WordFrequencyDomainService

router = APIRouter()


def convert_to_utc(dt_str: str) -> datetime:
    """把 ISO 8601 字符串规范化到 UTC。

    朴素时间视为 UTC；`Z` 后缀按 UTC 处理。
    """
    if dt_str.endswith("Z"):
        dt_str = dt_str.replace("Z", "+00:00")

    dt = datetime.fromisoformat(dt_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def parse_time_param(value: str | None, field_name: str) -> datetime | None:
    """解析可选的查询参数时间，格式非法时抛 400。"""
    if not value:
        return None
    try:
        return convert_to_utc(value)
    except ValueError as error:
        raise HTTPException(
            status_code=400, detail=f"Invalid {field_name} format: {error}"
        ) from error


def parse_time_range(
    start_time: str | None, end_time: str | None
) -> tuple[datetime | None, datetime | None]:
    """解析成对出现的时间范围参数。"""
    if bool(start_time) != bool(end_time):
        raise HTTPException(
            status_code=400,
            detail="Both start_time and end_time must be provided together",
        )
    return (
        parse_time_param(start_time, "start_time"),
        parse_time_param(end_time, "end_time"),
    )


# =====================================================
# 读接口
# =====================================================
@router.get(
    "/",
    response_model=DanmakuListResponse,
    summary="分页检索弹幕",
    description="按关键词、房间与时间范围分页检索弹幕，结果附带房间名称。",
)
async def list_danmaku(
    handler: ListDanmakuHandlerDep,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=200, alias="pageSize"),
    keyword: str | None = Query(None, description="匹配弹幕内容或用户名"),
    user_name: str | None = Query(None, alias="userName", description="精确匹配用户名"),
    room_id: int | None = Query(None, alias="roomId", description="Filter by room ID"),
    start_time: str | None = Query(None, alias="startTime"),
    end_time: str | None = Query(None, alias="endTime"),
    user_level_min: int | None = Query(None, alias="userLevelMin"),
    user_level_max: int | None = Query(None, alias="userLevelMax"),
    fan_medal_level_min: int | None = Query(None, alias="fanMedalLevelMin"),
    fan_medal_level_max: int | None = Query(None, alias="fanMedalLevelMax"),
    fan_medal_name: str | None = Query(None, alias="fanMedalName"),
    sort: str | None = Query(None, description='如 "created_at desc"'),
) -> DanmakuListResponse:
    start_dt, end_dt = parse_time_range(start_time, end_time)

    result = handler.handle(
        ListDanmakuQuery(
            page=page,
            page_size=page_size,
            keyword=keyword,
            user_name=user_name,
            room_id=room_id,
            start_time=start_dt,
            end_time=end_dt,
            user_level_min=user_level_min,
            user_level_max=user_level_max,
            fan_medal_level_min=fan_medal_level_min,
            fan_medal_level_max=fan_medal_level_max,
            fan_medal_name=fan_medal_name,
            sort=sort,
        )
    )
    return DanmakuListResponse(
        items=[DanmakuItemDto(**item.model_dump()) for item in result.items],
        total=result.total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/statistics",
    response_model=DanmakuStatisticsResponse,
    summary="弹幕总览统计",
    description="返回弹幕总数、独立用户数、活跃房间数与峰值小时。",
)
async def get_danmaku_statistics(
    handler: DanmakuStatisticsHandlerDep,
    room_id: int | None = Query(None, alias="roomId"),
    start_time: str | None = Query(None, alias="startTime"),
    end_time: str | None = Query(None, alias="endTime"),
) -> DanmakuStatisticsResponse:
    start_dt, end_dt = parse_time_range(start_time, end_time)
    result = handler.handle(
        GetDanmakuStatisticsQuery(room_id=room_id, start_time=start_dt, end_time=end_dt)
    )
    return DanmakuStatisticsResponse.from_application(result)


@router.get(
    "/word-frequency",
    response_model=WordFrequencyResponse,
    summary="词频 Top-N",
    description="按时间范围（可选房间）返回词频最高的 N 个词。",
)
async def get_word_frequency(
    handler: WordFrequencyHandlerDep,
    start_time: str = Query(..., alias="startTime"),
    end_time: str = Query(..., alias="endTime"),
    top_n: int = Query(WordFrequencyDomainService.DEFAULT_TOP_N, gt=0, alias="topN"),
    room_id: int | None = Query(None, alias="roomId"),
) -> WordFrequencyResponse:
    start_dt = parse_time_param(start_time, "start_time")
    end_dt = parse_time_param(end_time, "end_time")
    if start_dt is None or end_dt is None:
        raise HTTPException(
            status_code=400, detail="start_time and end_time are required"
        )
    if start_dt > end_dt:
        raise HTTPException(
            status_code=400, detail="start_time must be before end_time"
        )

    try:
        result = await handler.handle(
            GetWordFrequencyQuery(
                start_time=start_dt,
                end_time=end_dt,
                room_id=room_id,
                top_n=top_n,
            )
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return WordFrequencyResponse(
        room_id=result.room_id,
        start_time=result.start_time,
        end_time=result.end_time,
        frequencies=[
            WordFrequencyItemDto(word=item.word, count=item.count)
            for item in result.frequencies
        ],
    )


@router.get(
    "/wordcloud",
    response_model=WordcloudResponse,
    summary="词云数据",
    description="返回词云渲染所需的数据（含归一化权重）。",
)
async def get_wordcloud_data(
    handler: WordcloudHandlerDep,
    start_time: str = Query(..., alias="startTime"),
    end_time: str = Query(..., alias="endTime"),
    room_id: int | None = Query(None, alias="roomId"),
) -> WordcloudResponse:
    start_dt = parse_time_param(start_time, "start_time")
    end_dt = parse_time_param(end_time, "end_time")
    if start_dt is None or end_dt is None:
        raise HTTPException(
            status_code=400, detail="start_time and end_time are required"
        )
    if start_dt > end_dt:
        raise HTTPException(
            status_code=400, detail="start_time must be before end_time"
        )

    try:
        result = await handler.handle(
            GetWordcloudQuery(start_time=start_dt, end_time=end_dt, room_id=room_id)
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return WordcloudResponse(
        room_id=result.room_id,
        start_time=result.start_time,
        end_time=result.end_time,
        words=[
            WordcloudWordDto(
                word=item.word,
                count=item.count,
                weight=round(item.count / result.max_count, 4)
                if result.max_count
                else 0.0,
            )
            for item in result.words
        ],
        max_count=result.max_count,
    )


# =====================================================
# 写接口
# =====================================================
@router.post(
    "/analysis/generate",
    response_model=DanmakuAnalysisResponse,
    summary="生成弹幕词频分析",
    description=(
        "为指定时间范围生成词频分析；提供 room_id 时只分析该房间，"
        "否则分析全部活跃房间。"
    ),
)
async def generate_analysis(
    generate_handler: GenerateAnalysisHandlerDep,
    precompute_handler: PrecomputeAllRoomsHandlerDep,
    payload: AnalysisGenerateRequest = Body(...),
) -> DanmakuAnalysisResponse:
    start_dt = parse_time_param(payload.start_time, "start_time")
    end_dt = parse_time_param(payload.end_time, "end_time")
    if start_dt is None or end_dt is None:
        raise HTTPException(
            status_code=400,
            detail="Both start_time and end_time are required",
        )
    if start_dt > end_dt:
        raise HTTPException(
            status_code=400, detail="start_time must be before end_time"
        )

    try:
        if payload.room_id:
            dto = await generate_handler.handle(
                GenerateAnalysisCommand(
                    start_time=start_dt,
                    end_time=end_dt,
                    room_id=payload.room_id,
                    period=payload.period_type,
                    top_n=payload.top_n,
                )
            )
            return DanmakuAnalysisResponse.from_application(dto)

        summary = await precompute_handler.handle(
            PrecomputeAllRoomsCommand(
                start_time=start_dt,
                end_time=end_dt,
                period=payload.period_type,
                top_n=payload.top_n,
            )
        )
        return DanmakuAnalysisResponse.from_application(summary)
    except HTTPException:
        raise
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"Error during analysis: {error}"
        ) from error
