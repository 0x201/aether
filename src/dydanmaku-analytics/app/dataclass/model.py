from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class CaptureStartRequest(BaseModel):
    url: str
    duration: int


class CaptureStopRequest(BaseModel):
    room_id: int


class DanmakuDto(BaseModel):
    id: int
    user_id: Optional[str]
    user_name: Optional[str]
    content: Optional[str]
    fan_medal_name: Optional[str]
    fan_medal_level: Optional[int]
    user_level: Optional[int]
    created_at: str
    room_id: Optional[int]


class DanmakuWithRoomDto(DanmakuDto):
    room_name: Optional[str]


class DanmakuCreateDto(BaseModel):
    id: int
    user_id: str
    user_name: str
    content: str
    fan_medal_name: Optional[str] = None
    fan_medal_level: Optional[int] = None
    user_level: Optional[int] = None
    room_id: Optional[int] = None


class DanmakuUpdateDto(BaseModel):
    user_name: Optional[str] = None
    content: Optional[str] = None
    fan_medal_name: Optional[str] = None
    fan_medal_level: Optional[int] = None
    user_level: Optional[int] = None


class TopUserDto(BaseModel):
    user_name: str
    count: int


class HourlyDistributionDto(BaseModel):
    hour: str
    count: int


class DanmakuStatsDto(BaseModel):
    total_count: int
    unique_users: int
    top_users: List[TopUserDto]
    hourly_distribution: List[HourlyDistributionDto]


class RoomInfoDto(BaseModel):
    room_name: str
    anchor_name: str
    anchor_level: int
    room_id: int


class CaptureStartResponse(BaseModel):
    message: str
    room_id: int
    room_info: Optional[RoomInfoDto]


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
    end_time: Optional[str]
    created_at: str
