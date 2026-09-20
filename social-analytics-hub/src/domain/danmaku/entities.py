from dataclasses import dataclass
from datetime import datetime


@dataclass
class DanmakuEntity:
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


@dataclass
class CaptureJobEntity:
    id: int
    room_id: int
    status: str
    duration: int
    start_time: datetime
    end_time: datetime
    created_at: datetime

    def is_valid_duration(self) -> bool:
        return bool(self.duration >= 0)


@dataclass
class DanmakuAnalysisEntity:
    id: int
    room_id: int | None
    start_time: datetime
    end_time: datetime
    type: str
    frequencies: str | None
    created_at: datetime
