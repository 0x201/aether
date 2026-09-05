from enum import Enum

from pydantic import BaseModel


class CaptureStartRequest(BaseModel):
    url: str
    duration: int


class CaptureStopRequest(BaseModel):
    room_id: int


class DanmakuDto(BaseModel):
    id: int
    user_id: str | None
    user_name: str | None
    content: str | None
    fan_medal_name: str | None
    fan_medal_level: int | None
    user_level: int | None
    created_at: str
    room_id: int | None


class DanmakuWithRoomDto(DanmakuDto):
    room_name: str | None


class DanmakuCreateDto(BaseModel):
    id: int
    user_id: str
    user_name: str
    content: str
    fan_medal_name: str | None = None
    fan_medal_level: int | None = None
    user_level: int | None = None
    room_id: int | None = None


class DanmakuUpdateDto(BaseModel):
    user_name: str | None = None
    content: str | None = None
    fan_medal_name: str | None = None
    fan_medal_level: int | None = None
    user_level: int | None = None


class TopUserDto(BaseModel):
    user_name: str
    count: int


class HourlyDistributionDto(BaseModel):
    hour: str
    count: int


class DanmakuStatsDto(BaseModel):
    total_count: int
    unique_users: int
    top_users: list[TopUserDto]
    hourly_distribution: list[HourlyDistributionDto]


class RoomInfoDto(BaseModel):
    room_name: str
    anchor_name: str
    anchor_level: int
    room_id: int


class CaptureStartResponse(BaseModel):
    message: str
    room_id: int
    room_info: RoomInfoDto | None


class CaptureJobStatus(Enum):
    PENDING = "Pending"
    RUNNING = "Running"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"
    FAILED = "Failed"
    TERMINATED = "Terminated"


class CaptureJobDto(BaseModel):
    id: int
    room_id: int
    status: str
    duration: int
    start_time: str
    end_time: str | None
    created_at: str
