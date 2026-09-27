from dataclasses import dataclass
from datetime import datetime

from .value_objects import CaptureJobStatus


@dataclass(slots=True)
class DanmakuEntity:
    """弹幕实体。"""

    id: int | None
    user_id: str | None
    user_name: str | None
    content: str | None
    room_id: int | None
    fan_medal_name: str | None
    fan_medal_level: int | None
    user_level: int | None
    created_at: datetime

    def is_valid_content(self) -> bool:
        return bool(self.content and not self.content.isspace())

    def has_fan_medal(self) -> bool:
        return bool(self.fan_medal_name)

    def is_from_room(self, room_id: int) -> bool:
        return self.room_id == room_id


@dataclass(frozen=True, slots=True)
class DanmakuWithRoom:
    """弹幕实体附带房间名称（读模型投影，仍是领域层类型）。"""

    danmaku: DanmakuEntity
    room_name: str | None

    @property
    def room_id(self) -> int | None:
        return self.danmaku.room_id


@dataclass(slots=True)
class CaptureJobEntity:
    """弹幕抓取任务实体。"""

    id: int | None
    room_id: int
    status: CaptureJobStatus
    duration: int
    start_time: datetime
    end_time: datetime | None
    created_at: datetime

    def is_valid_duration(self) -> bool:
        return self.duration >= 0

    def is_active(self) -> bool:
        return self.status in CaptureJobStatus.active_statuses()

    def is_finished(self) -> bool:
        return self.status in (
            CaptureJobStatus.COMPLETED,
            CaptureJobStatus.CANCELLED,
            CaptureJobStatus.FAILED,
            CaptureJobStatus.TERMINATED,
        )

    def elapsed_seconds(self, now: datetime) -> float:
        reference = self.end_time or now
        return (reference - self.start_time).total_seconds()


@dataclass(slots=True)
class DanmakuAnalysisEntity:
    """弹幕词频分析结果实体。"""

    id: int | None
    room_id: int | None
    start_time: datetime
    end_time: datetime
    type: str
    frequencies: str | None
    created_at: datetime

    def has_frequencies(self) -> bool:
        return bool(self.frequencies)

    def frequencies_count(self) -> int:
        """词频条目数量（载荷为 JSON 数组字符串时按元素计数）。"""
        if not self.frequencies:
            return 0
        import json

        try:
            payload = json.loads(self.frequencies)
        except TypeError, ValueError:
            return 0
        if isinstance(payload, list):
            return len(payload)
        return 0
