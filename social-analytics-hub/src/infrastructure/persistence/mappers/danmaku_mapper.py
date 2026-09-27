"""ORM 模型 ↔ 领域实体映射的唯一入口。

所有仓储必须通过本模块转换，禁止在仓储内部内联构造实体，避免字段漏配。
"""

from src.domain.danmaku.entities import (
    CaptureJobEntity,
    DanmakuAnalysisEntity,
    DanmakuEntity,
)
from src.domain.danmaku.value_objects import CaptureJobStatus
from src.infrastructure.persistence.models.capture_job import CaptureJobModel
from src.infrastructure.persistence.models.danmaku import DanmakuModel
from src.infrastructure.persistence.models.danmaku_analysis import (
    DanmakuAnalysisModel,
)


def to_danmaku_model(entity: DanmakuEntity) -> DanmakuModel:
    model = DanmakuModel(
        id=entity.id,
        user_id=entity.user_id,
        user_name=entity.user_name,
        content=entity.content,
        fan_medal_name=entity.fan_medal_name,
        fan_medal_level=entity.fan_medal_level,
        user_level=entity.user_level,
        room_id=entity.room_id,
    )
    return model


def to_danmaku_entity(model: DanmakuModel) -> DanmakuEntity:
    return DanmakuEntity(
        id=model.id,
        user_id=model.user_id,
        user_name=model.user_name,
        content=model.content,
        room_id=model.room_id,
        fan_medal_name=model.fan_medal_name,
        fan_medal_level=model.fan_medal_level,
        user_level=model.user_level,
        created_at=model.created_at,
    )


def to_capture_job_model(entity: CaptureJobEntity) -> CaptureJobModel:
    model = CaptureJobModel(
        id=entity.id,
        room_id=entity.room_id,
        status=CaptureJobStatus(entity.status).value,
        duration=entity.duration,
        start_time=entity.start_time,
        end_time=entity.end_time,
    )
    return model


def to_capture_job_entity(model: CaptureJobModel) -> CaptureJobEntity:
    return CaptureJobEntity(
        id=model.id,
        room_id=model.room_id,
        status=CaptureJobStatus(model.status),
        duration=model.duration,
        start_time=model.start_time,
        end_time=model.end_time,
        created_at=model.created_at,
    )


def to_danmaku_analysis_model(
    entity: DanmakuAnalysisEntity,
) -> DanmakuAnalysisModel:
    model = DanmakuAnalysisModel(
        id=entity.id,
        room_id=entity.room_id,
        start_time=entity.start_time,
        end_time=entity.end_time,
        type=entity.type,
        frequencies=entity.frequencies,
        created_at=entity.created_at,
    )
    return model


def to_danmaku_analysis_entity(
    model: DanmakuAnalysisModel,
) -> DanmakuAnalysisEntity:
    return DanmakuAnalysisEntity(
        id=model.id,
        room_id=model.room_id,
        start_time=model.start_time,
        end_time=model.end_time,
        type=model.type,
        frequencies=model.frequencies,
        created_at=model.created_at,
    )
