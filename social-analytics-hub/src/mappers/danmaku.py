from src.models import CaptureJob, Danmaku, DanmakuAnalysis
from src.schemas import (
    CaptureJobDto,
    DanmakuAnalysisDto,
    DanmakuDto,
    DanmakuWithRoomDto,
)


def to_danmaku_dto(entity: Danmaku) -> DanmakuDto:
    return DanmakuDto.model_validate(entity)


def to_danmaku_with_room_dto(row: tuple[Danmaku, str | None]) -> DanmakuWithRoomDto:
    danmaku, room_name = row
    base_data = DanmakuDto.model_validate(danmaku).model_dump()
    return DanmakuWithRoomDto(**base_data, room_name=room_name)


def to_capture_job_dto(entity: CaptureJob) -> CaptureJobDto:
    return CaptureJobDto.model_validate(entity)


def to_danmaku_analysis_dto(entity: DanmakuAnalysis) -> DanmakuAnalysisDto:
    return DanmakuAnalysisDto.model_validate(entity)
