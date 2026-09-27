"""领域实体 → 应用层 DTO 映射。"""

from src.domain.danmaku.entities import (
    CaptureJobEntity,
    DanmakuAnalysisEntity,
    DanmakuEntity,
    DanmakuWithRoom,
)
from src.domain.danmaku.services import WordFrequency
from src.domain.danmaku.value_objects import AnalysisPeriod

from .dtos import (
    CaptureJobDto,
    DanmakuAnalysisDto,
    DanmakuDto,
    WordFrequencyDto,
)


def to_danmaku_dto(entity: DanmakuEntity, room_name: str | None = None) -> DanmakuDto:
    return DanmakuDto(
        id=entity.id or 0,
        user_id=entity.user_id,
        user_name=entity.user_name,
        content=entity.content,
        room_id=entity.room_id,
        room_name=room_name,
        fan_medal_name=entity.fan_medal_name,
        fan_medal_level=entity.fan_medal_level,
        user_level=entity.user_level,
        created_at=entity.created_at,
    )


def to_danmaku_with_room_dto(row: DanmakuWithRoom) -> DanmakuDto:
    return to_danmaku_dto(row.danmaku, room_name=row.room_name)


def to_capture_job_dto(entity: CaptureJobEntity) -> CaptureJobDto:
    return CaptureJobDto(
        id=entity.id or 0,
        room_id=entity.room_id,
        status=entity.status,
        duration=entity.duration,
        start_time=entity.start_time,
        end_time=entity.end_time,
        created_at=entity.created_at,
    )


def to_danmaku_analysis_dto(
    entity: DanmakuAnalysisEntity,
    period_type: AnalysisPeriod = AnalysisPeriod.REALTIME,
) -> DanmakuAnalysisDto:
    return DanmakuAnalysisDto(
        room_id=entity.room_id,
        start_time=entity.start_time,
        end_time=entity.end_time,
        period_type=period_type,
        frequencies=entity.frequencies,
        frequencies_count=entity.frequencies_count(),
        type=entity.type,
        created_at=entity.created_at,
    )


def to_word_frequency_dto(frequency: WordFrequency) -> WordFrequencyDto:
    return WordFrequencyDto(word=frequency.word, count=frequency.count)
