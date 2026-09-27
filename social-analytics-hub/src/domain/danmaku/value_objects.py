"""领域值对象：不可变、自校验、无 I/O 依赖。"""

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum


@dataclass(frozen=True, slots=True)
class FanMedal:
    """粉丝牌（勋章）值对象。"""

    name: str
    level: int

    def __post_init__(self) -> None:
        if not self.name or not self.name.strip():
            raise ValueError("fan medal name must not be empty")
        if self.level < 0:
            raise ValueError("fan medal level must not be negative")

    @property
    def display_name(self) -> str:
        return f"{self.name} {self.level}"


class AnalysisType(StrEnum):
    """分析类型。"""

    COMBINED = "combined_analysis"


class CaptureJobStatus(StrEnum):
    """抓取任务状态。"""

    PENDING = "Pending"
    RUNNING = "Running"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"
    FAILED = "Failed"
    TERMINATED = "Terminated"

    @classmethod
    def active_statuses(cls) -> tuple[CaptureJobStatus, ...]:
        return (cls.PENDING, cls.RUNNING)


class AnalysisPeriod(StrEnum):
    """分析周期。

    领域概念：用于表达"统计的是哪一段时间粒度"，同时携带该粒度的调度语义。
    不依赖任何调度框架。
    """

    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    REALTIME = "realtime"

    @property
    def is_scheduled(self) -> bool:
        """实时（realtime）为按需触发，不参与定时预计算。"""
        return self is not AnalysisPeriod.REALTIME


@dataclass(frozen=True, slots=True)
class TimeRange:
    """时间区间值对象，保证 `start <= end`。

    只做顺序校验，不对时区做任何隐式转换：时区归一化属于接口层职责，
    领域层保持对输入的忠实。
    """

    start: datetime
    end: datetime

    def __post_init__(self) -> None:
        if self.start > self.end:
            raise ValueError("start must be before or equal to end")

    @property
    def duration_seconds(self) -> float:
        return (self.end - self.start).total_seconds()

    def contains(self, moment: datetime) -> bool:
        return self.start <= moment <= self.end

    @classmethod
    def of(cls, start: datetime, end: datetime) -> TimeRange:
        return cls(start=start, end=end)
