"""弹幕模块 HTTP 契约。

字段命名遵循既有前端/集成方约定（camelCase / 既有大写别名）。
枚举直接复用领域值对象，保证契约与领域只有一处定义。
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.application.danmaku.dtos import DanmakuStatisticsDto
from src.domain.danmaku.value_objects import AnalysisPeriod, CaptureJobStatus

#: HTTP 契约中的分析周期枚举（即领域 AnalysisPeriod）
PeriodType = AnalysisPeriod


# =====================================================
# 请求
# =====================================================
class AnalysisGenerateRequest(BaseModel):
    """触发分析请求。"""

    start_time: str = Field(
        description="Start time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    )
    end_time: str = Field(
        description="End time in ISO 8601 format (e.g., 2026-01-11T10:00:00Z)"
    )
    room_id: int | None = Field(default=None, description="Filter by room ID")
    period_type: PeriodType = Field(
        default=PeriodType.HOURLY, description="Analysis period type"
    )
    top_n: int = Field(default=100, gt=0, description="Top N words to keep")


class DanmakuUpdateDto(BaseModel):
    """更新弹幕请求体。"""

    user_name: str | None = None
    content: str | None = None
    fan_medal_name: str | None = None
    fan_medal_level: int | None = None
    user_level: int | None = None


class DanmakuCreateDto(BaseModel):
    """创建弹幕请求体。"""

    user_id: str
    user_name: str
    content: str
    fan_medal_name: str | None = None
    fan_medal_level: int | None = None
    user_level: int | None = None
    room_id: int | None = None


class CaptureStartRequest(BaseModel):
    url: str
    duration: int


class CaptureStopRequest(BaseModel):
    room_id: int


# =====================================================
# 响应
# =====================================================
class DanmakuItemDto(BaseModel):
    """单条弹幕响应项。"""

    id: int
    user_id: str | None = None
    user_name: str | None = None
    content: str | None = None
    room_id: int | None = None
    room_name: str | None = None
    fan_medal_name: str | None = None
    fan_medal_level: int | None = None
    user_level: int | None = None
    created_at: datetime


class DanmakuListResponse(BaseModel):
    """弹幕分页响应。"""

    model_config = ConfigDict(populate_by_name=True)

    items: list[DanmakuItemDto] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = Field(default=20, alias="pageSize")


class DanmakuAnalysisResponse(BaseModel):
    """分析结果响应（字段名与既有集成契约一致）。"""

    roomId: int | None = None
    startDate: datetime
    endDate: datetime
    periodType: str
    frequencies: str | None = None
    frequenciesCount: int = 0
    type: str
    createdAt: datetime

    @classmethod
    def from_application(cls, dto) -> DanmakuAnalysisResponse:
        """由 `DanmakuAnalysisDto` 或 `AnalysisRunSummaryDto` 构建响应。"""
        frequencies_count = getattr(
            dto, "frequencies_count", getattr(dto, "analysed_rooms", 0)
        )
        return cls(
            roomId=dto.room_id,
            startDate=dto.start_time,
            endDate=dto.end_time,
            periodType=dto.period_type.value,
            frequencies=getattr(dto, "frequencies", None),
            frequenciesCount=frequencies_count,
            type=dto.type,
            createdAt=dto.created_at,
        )


class DanmakuStatisticsResponse(BaseModel):
    """弹幕总览统计响应。"""

    model_config = ConfigDict(populate_by_name=True)

    total_messages: int = Field(default=0, alias="totalMessages")
    unique_users: int = Field(default=0, alias="uniqueUsers")
    active_rooms: int = Field(default=0, alias="activeRooms")
    peak_hour: int | None = Field(default=None, alias="peakHour")

    @classmethod
    def from_application(cls, dto: DanmakuStatisticsDto) -> DanmakuStatisticsResponse:
        return cls(
            total_messages=dto.total_messages,
            unique_users=dto.unique_users,
            active_rooms=dto.active_rooms,
            peak_hour=dto.peak_hour,
        )


class WordFrequencyItemDto(BaseModel):
    """单词频次响应项。"""

    word: str
    count: int


class WordFrequencyResponse(BaseModel):
    """词频响应。"""

    model_config = ConfigDict(populate_by_name=True)

    room_id: int | None = Field(default=None, alias="roomId")
    start_time: datetime = Field(alias="startTime")
    end_time: datetime = Field(alias="endTime")
    frequencies: list[WordFrequencyItemDto] = Field(default_factory=list)


class WordcloudWordDto(BaseModel):
    """词云单词响应项（附带归一化权重，便于前端直接渲染字号）。"""

    word: str
    count: int
    weight: float = 0.0


class WordcloudResponse(BaseModel):
    """词云响应。"""

    model_config = ConfigDict(populate_by_name=True)

    room_id: int | None = Field(default=None, alias="roomId")
    start_time: datetime = Field(alias="startTime")
    end_time: datetime = Field(alias="endTime")
    words: list[WordcloudWordDto] = Field(default_factory=list)
    max_count: int = Field(default=0, alias="maxCount")


__all__ = [
    "AnalysisGenerateRequest",
    "AnalysisPeriod",
    "CaptureJobStatus",
    "CaptureStartRequest",
    "CaptureStopRequest",
    "DanmakuAnalysisResponse",
    "DanmakuCreateDto",
    "DanmakuItemDto",
    "DanmakuListResponse",
    "DanmakuStatisticsResponse",
    "DanmakuUpdateDto",
    "PeriodType",
    "WordFrequencyItemDto",
    "WordFrequencyResponse",
    "WordcloudResponse",
    "WordcloudWordDto",
]
