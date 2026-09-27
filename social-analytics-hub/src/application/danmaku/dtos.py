"""应用层 DTO：承载用例输入/输出，不依赖 Web 框架。

字段命名使用 Python 风格（snake_case）；对外 JSON 字段名由 `src/api/schemas`
统一负责，两者之间通过应用层 mapper 转换。
"""

from datetime import datetime

from pydantic import BaseModel, Field

from src.domain.danmaku.value_objects import AnalysisPeriod, CaptureJobStatus


class DanmakuDto(BaseModel):
    """单条弹幕。"""

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


class DanmakuPageDto(BaseModel):
    """弹幕分页结果。"""

    items: list[DanmakuDto] = Field(default_factory=list)
    total: int = 0


class DanmakuStatisticsDto(BaseModel):
    """弹幕总览统计。"""

    total_messages: int = 0
    unique_users: int = 0
    active_rooms: int = 0
    peak_hour: int | None = None


class WordFrequencyDto(BaseModel):
    """单词频次。"""

    word: str
    count: int


class WordFrequencyResultDto(BaseModel):
    """词频查询结果。"""

    room_id: int | None = None
    start_time: datetime
    end_time: datetime
    frequencies: list[WordFrequencyDto] = Field(default_factory=list)


class WordcloudResultDto(BaseModel):
    """词云查询结果。"""

    room_id: int | None = None
    start_time: datetime
    end_time: datetime
    words: list[WordFrequencyDto] = Field(default_factory=list)
    max_count: int = 0


class DanmakuAnalysisDto(BaseModel):
    """分析结果。"""

    room_id: int | None = None
    start_time: datetime
    end_time: datetime
    period_type: AnalysisPeriod = AnalysisPeriod.REALTIME
    frequencies: str | None = None
    frequencies_count: int = 0
    type: str
    created_at: datetime


class AnalysisRunSummaryDto(BaseModel):
    """批量分析执行摘要。"""

    room_id: int | None = None
    start_time: datetime
    end_time: datetime
    period_type: AnalysisPeriod = AnalysisPeriod.REALTIME
    type: str
    analysed_rooms: int = 0
    frequencies_count: int = 0
    created_at: datetime


class CaptureJobDto(BaseModel):
    """抓取任务。"""

    id: int
    room_id: int
    status: CaptureJobStatus
    duration: int
    start_time: datetime
    end_time: datetime | None = None
    created_at: datetime
