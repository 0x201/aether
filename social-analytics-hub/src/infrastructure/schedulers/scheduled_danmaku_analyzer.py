from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from src.application.danmaku.services import DanmakuAnalyzer
from src.domain.danmaku.value_objects import AnalysisPeriod


class TimeRangeStrategy(ABC):
    @abstractmethod
    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        raise NotImplementedError


class HourlyTimeRangeStrategy(TimeRangeStrategy):
    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        end_time = now.replace(minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(hours=1)
        return start_time, end_time


class DailyTimeRangeStrategy(TimeRangeStrategy):
    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        end_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(days=1)
        return start_time, end_time


class WeeklyTimeRangeStrategy(TimeRangeStrategy):
    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        days_since_monday = now.weekday()
        end_time = (now - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        start_time = end_time - timedelta(weeks=1)
        return start_time, end_time


class MonthlyTimeRangeStrategy(TimeRangeStrategy):
    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        end_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if end_time.month == 1:
            start_time = end_time.replace(year=end_time.year - 1, month=12)
        else:
            start_time = end_time.replace(month=end_time.month - 1)
        return start_time, end_time


class YearlyTimeRangeStrategy(TimeRangeStrategy):
    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        end_time = now.replace(
            month=1, day=1, hour=0, minute=0, second=0, microsecond=0
        )
        start_time = end_time.replace(year=end_time.year - 1)
        return start_time, end_time


class TimeRangeStrategyFactory:
    _strategies: dict[AnalysisPeriod, TimeRangeStrategy] = {
        AnalysisPeriod.HOURLY: HourlyTimeRangeStrategy(),
        AnalysisPeriod.DAILY: DailyTimeRangeStrategy(),
        AnalysisPeriod.WEEKLY: WeeklyTimeRangeStrategy(),
        AnalysisPeriod.MONTHLY: MonthlyTimeRangeStrategy(),
        AnalysisPeriod.YEARLY: YearlyTimeRangeStrategy(),
    }

    @classmethod
    def get_strategy(cls, date_range: AnalysisPeriod) -> TimeRangeStrategy:
        strategy = cls._strategies.get(date_range)
        if not strategy:
            strategy = cls._strategies[AnalysisPeriod.HOURLY]
        return strategy


class ScheduledDanmakuAnalyzer:
    def __init__(self, danmaku_analyzer: DanmakuAnalyzer) -> None:
        self.scheduler = AsyncIOScheduler()
        self.analyzer = danmaku_analyzer

    async def _execute_precompute_analyses(self, period_type: AnalysisPeriod):
        await self._precompute_analyses(period_type)

    def start(self) -> None:
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(minute=1),
            id="precompute_hourly_analyses",
            name="Precompute hourly analyses",
            replace_existing=True,
            args=[AnalysisPeriod.HOURLY],
        )
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(hour=0, minute=2),
            id="precompute_daily_analyses",
            name="Precompute daily analyses",
            replace_existing=True,
            args=[AnalysisPeriod.DAILY],
        )
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(day_of_week=0, hour=0, minute=3),
            id="precompute_weekly_analyses",
            name="Precompute weekly analyses",
            replace_existing=True,
            args=[AnalysisPeriod.WEEKLY],
        )
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(day=1, hour=0, minute=4),
            id="precompute_monthly_analyses",
            name="Precompute monthly analyses",
            replace_existing=True,
            args=[AnalysisPeriod.MONTHLY],
        )
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(month=1, day=1, hour=0, minute=5),
            id="precompute_yearly_analyses",
            name="Precompute yearly analyses",
            replace_existing=True,
            args=[AnalysisPeriod.YEARLY],
        )

        if not self.scheduler.running:
            self.scheduler.start()
        logger.info("Scheduled analyzer started")

    def stop(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown()
        logger.info("Scheduled analyzer stopped")

    async def _precompute_analyses(
        self, period_type: AnalysisPeriod = AnalysisPeriod.HOURLY
    ) -> None:
        now = datetime.now(UTC)
        strategy = TimeRangeStrategyFactory.get_strategy(period_type)
        start_time, end_time = strategy.calculate_time_range(now)

        logger.info(
            f"Precomputing {period_type.value} analyses for time range: "
            f"{start_time} to {end_time}"
        )

        try:
            await self.analyzer.precompute_for_all_rooms(
                period_type, start_time, end_time
            )
        except Exception:
            logger.exception("Error during scheduled precomputation")
