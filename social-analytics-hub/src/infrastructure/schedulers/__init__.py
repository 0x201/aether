"""调度器生命周期管理。

容器在应用启动时注入，`start_scheduled_tasks`/`stop_scheduled_tasks` 由
`src/app.py` 的 lifespan 调用。
"""

from typing import TYPE_CHECKING

from .scheduled_danmaku_analyzer import (
    DailyTimeRangeStrategy,
    HourlyTimeRangeStrategy,
    MonthlyTimeRangeStrategy,
    ScheduledDanmakuAnalyzer,
    TimeRangeStrategy,
    TimeRangeStrategyFactory,
    WeeklyTimeRangeStrategy,
    YearlyTimeRangeStrategy,
)

if TYPE_CHECKING:
    from src.container import AppContainer

__all__ = [
    "DailyTimeRangeStrategy",
    "HourlyTimeRangeStrategy",
    "MonthlyTimeRangeStrategy",
    "ScheduledDanmakuAnalyzer",
    "TimeRangeStrategy",
    "TimeRangeStrategyFactory",
    "WeeklyTimeRangeStrategy",
    "YearlyTimeRangeStrategy",
    "set_container",
    "start_scheduled_tasks",
    "stop_scheduled_tasks",
]


_container: AppContainer | None = None
_scheduled_tasks: list[ScheduledDanmakuAnalyzer] = []


def set_container(app_container: AppContainer) -> None:
    global _container
    _container = app_container


def _initialize_scheduled_tasks() -> list[ScheduledDanmakuAnalyzer]:
    global _scheduled_tasks
    if _container is None:
        raise RuntimeError("Container not set. Call set_container first.")
    _scheduled_tasks = [_container.scheduled_danmaku_analyzer()]
    return _scheduled_tasks


def start_scheduled_tasks() -> None:
    for task in _initialize_scheduled_tasks():
        task.start()


def stop_scheduled_tasks() -> None:
    global _scheduled_tasks
    for task in _scheduled_tasks:
        task.stop()
    _scheduled_tasks = []
