"""
Scheduled analyzer service for precomputing word frequency and wordcloud data
"""
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.memory import MemoryJobStore

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from app.database import SessionFactory
from app.dataclass import PeriodType
from app.messaging import EventBus
from app.services import DanmakuAnalyzer


class TimeRangeStrategy(ABC):
    """Time range calculation strategy interface"""

    @abstractmethod
    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        """Calculate time range, return (start_time, end_time)"""
        pass


class HourlyTimeRangeStrategy(TimeRangeStrategy):
    """Calculate the time range of the previous hour"""

    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        end_time = now.replace(minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(hours=1)
        return start_time, end_time


class DailyTimeRangeStrategy(TimeRangeStrategy):
    """Calculate the time range of the previous day"""

    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        end_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(days=1)
        return start_time, end_time


class WeeklyTimeRangeStrategy(TimeRangeStrategy):
    """Calculate the time range of the previous week (Monday to Sunday)"""

    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        # Calculate to the Monday of the current week
        days_since_monday = now.weekday()  # Monday is 0, Sunday is 6
        end_time = (now - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        start_time = end_time - timedelta(weeks=1)  # Last Monday
        return start_time, end_time


class MonthlyTimeRangeStrategy(TimeRangeStrategy):
    """Calculate the time range of the previous month"""

    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        # Get the first day of the current month
        end_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Calculate the first day of the previous month
        if end_time.month == 1:
            start_time = end_time.replace(year=end_time.year - 1, month=12)
        else:
            start_time = end_time.replace(month=end_time.month - 1)
        return start_time, end_time


class YearlyTimeRangeStrategy(TimeRangeStrategy):
    """Calculate the time range of the previous year"""

    def calculate_time_range(self, now: datetime) -> tuple[datetime, datetime]:
        end_time = now.replace(
            month=1, day=1, hour=0, minute=0, second=0, microsecond=0
        )
        start_time = end_time.replace(year=end_time.year - 1)
        return start_time, end_time


class TimeRangeStrategyFactory:
    """TimeRangeStrategy Factory"""

    _strategies = {
        PeriodType.HOURLY: HourlyTimeRangeStrategy(),
        PeriodType.DAILY: DailyTimeRangeStrategy(),
        PeriodType.WEEKLY: WeeklyTimeRangeStrategy(),
        PeriodType.MONTHLY: MonthlyTimeRangeStrategy(),
        PeriodType.YEARLY: YearlyTimeRangeStrategy(),
    }

    @classmethod
    def get_strategy(cls, date_range: PeriodType) -> TimeRangeStrategy:
        strategy = cls._strategies.get(date_range)
        if not strategy:
            # Fallback to Hourly
            strategy = cls._strategies[PeriodType.HOURLY]
        return strategy


class ScheduledDanmakuAnalyzer:
    def __init__(
        self,
        session_factory: SessionFactory,
        danmaku_analyzer: DanmakuAnalyzer,
        event_bus: EventBus,
    ):
        jobstores = {
            'default': MemoryJobStore()
        }
        executors = {
            'default': ThreadPoolExecutor(20),
        }
        job_defaults = {
            'coalesce': False,
            'max_instances': 1,
            'misfire_grace_time': 30
        }
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
        )
        self.session_factory = session_factory
        self.analyzer = danmaku_analyzer
        self.event_bus = event_bus

    async def _execute_precompute_analyses(self, period_type: PeriodType):
        await self._precompute_analyses(period_type)

    def start(self):
        """Start the scheduled analyzer"""
        # Schedule the precomputation to run every hour at 1 minutes past the hour
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(minute=1),  # Run at 1 minutes past each hour except midnight
            id="precompute_hourly_analyses",
            name="Precompute hourly analyses",
            replace_existing=True,
            args=[PeriodType.HOURLY],
        )

        # Schedule daily analysis computation to run at 00:02 every day
        # This computes analysis for the previous day, avoiding conflict with hourly job
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(hour=0, minute=2),
            id="precompute_daily_analyses",
            name="Precompute daily analyses",
            replace_existing=True,
            args=[PeriodType.DAILY],
        )

        # Schedule weekly analysis computation to run on Mondays at 00:03
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(day_of_week=0, hour=0, minute=3),
            id="precompute_weekly_analyses",
            name="Precompute weekly analyses",
            replace_existing=True,
            args=[PeriodType.WEEKLY],
        )

        # Schedule monthly analysis computation to run on the first day of each month at 00:04
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(day=1, hour=0, minute=4),
            id="precompute_monthly_analyses",
            name="Precompute monthly analyses",
            replace_existing=True,
            args=[PeriodType.MONTHLY],
        )

        # Schedule yearly analysis computation to run on the first day of each year at 00:05
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(month=1, day=1, hour=0, minute=5),
            id="precompute_yearly_analyses",
            name="Precompute yearly analyses",
            replace_existing=True,
            args=[PeriodType.YEARLY],
        )

        if not self.scheduler.running:
            self.scheduler.start()
        logger.info("Scheduled analyzer started")

    def stop(self):
        """Stop the scheduled analyzer"""
        try:
            if self.scheduler.running:
                self.scheduler.shutdown(wait=True)
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {e}")
        logger.info("Scheduled analyzer stopped")

    async def _precompute_analyses(self, period_type: PeriodType = PeriodType.HOURLY):
        """Precompute analyses for the last completed period based on date_range"""
        now = datetime.now(timezone.utc)

        strategy = TimeRangeStrategyFactory.get_strategy(period_type)
        start_time, end_time = strategy.calculate_time_range(now)

        logger.info(
            f"Precomputing {period_type.value} analyses for time range: {start_time} to {end_time}"
        )

        try:
            await self.analyzer.precompute_for_all_rooms(
                period_type, start_time, end_time
            )

        except Exception as e:
            logger.error(f"Error during scheduled precomputation: {e}")
