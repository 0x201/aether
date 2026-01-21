"""
Scheduled analyzer service for precomputing word frequency and wordcloud data
"""

from datetime import datetime, timedelta, timezone
from enum import Enum
from abc import ABC, abstractmethod
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.models import Danmaku

from app.database.session_connector import SessionConnector
from app.services.analyze_danmaku import DanmakuAnalyzer

from loguru import logger


class DateRange(Enum):
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


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
        DateRange.HOURLY: HourlyTimeRangeStrategy(),
        DateRange.DAILY: DailyTimeRangeStrategy(),
        DateRange.WEEKLY: WeeklyTimeRangeStrategy(),
        DateRange.MONTHLY: MonthlyTimeRangeStrategy(),
        DateRange.YEARLY: YearlyTimeRangeStrategy(),
    }

    @classmethod
    def get_strategy(cls, date_range: DateRange) -> TimeRangeStrategy:
        strategy = cls._strategies.get(date_range)
        if not strategy:
            # Fallback to Hourly
            strategy = cls._strategies[DateRange.HOURLY]
        return strategy


class ScheduledAnalyzer:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.session_connector = SessionConnector()
        self.analyzer = DanmakuAnalyzer()

    async def _execute_precompute_analyses(self, date_range: DateRange):
        await self._precompute_analyses(date_range)

    def start(self):
        """Start the scheduled analyzer"""
        # Schedule the precomputation to run every hour at 1 minutes past the hour
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(minute=1),  # Run at 1 minutes past each hour except midnight
            id="precompute_hourly_analyses",
            name="Precompute hourly analyses",
            replace_existing=True,
            args=[DateRange.HOURLY],
        )

        # Schedule daily analysis computation to run at 00:02 every day
        # This computes analysis for the previous day, avoiding conflict with hourly job
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(hour=0, minute=2),
            id="precompute_daily_analyses",
            name="Precompute daily analyses",
            replace_existing=True,
            args=[DateRange.DAILY],
        )

        # Schedule weekly analysis computation to run on Mondays at 00:03
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(day_of_week=0, hour=0, minute=3),
            id="precompute_weekly_analyses",
            name="Precompute weekly analyses",
            replace_existing=True,
            args=[DateRange.WEEKLY],
        )

        # Schedule monthly analysis computation to run on the first day of each month at 00:04
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(day=1, hour=0, minute=4),
            id="precompute_monthly_analyses",
            name="Precompute monthly analyses",
            replace_existing=True,
            args=[DateRange.MONTHLY],
        )

        # Schedule yearly analysis computation to run on the first day of each year at 00:05
        self.scheduler.add_job(
            self._execute_precompute_analyses,
            CronTrigger(month=1, day=1, hour=0, minute=5),
            id="precompute_yearly_analyses",
            name="Precompute yearly analyses",
            replace_existing=True,
            args=[DateRange.YEARLY],
        )

        if not self.scheduler.running:
            self.scheduler.start()
        logger.info("Scheduled analyzer started")

    def stop(self):
        """Stop the scheduled analyzer"""
        self.scheduler.shutdown()
        logger.info("Scheduled analyzer stopped")

    async def _precompute_analyses(self, date_range: DateRange = DateRange.HOURLY):
        """Precompute analyses for the last completed period based on date_range"""
        now = datetime.now(timezone.utc)

        strategy = TimeRangeStrategyFactory.get_strategy(date_range)
        start_time, end_time = strategy.calculate_time_range(now)

        logger.info(
            f"Precomputing {date_range.value} analyses for time range: {start_time} to {end_time}"
        )

        try:
            with self.session_connector.get_session() as db:
                self.analyzer.precompute_analyses(
                    session=db, start_time=start_time, end_time=end_time, room_id=None
                )
                await self._precompute_for_all_rooms(db, start_time, end_time)

        except Exception as e:
            logger.error(f"Error during scheduled precomputation: {e}")

    async def _precompute_for_all_rooms(
        self, db: Session, start_time: datetime, end_time: datetime
    ):
        """Precompute analyses for all rooms individually"""

        # Get all unique room IDs that had activity in the last 24 hours
        stmt = (
            select(Danmaku.room_id)
            .where(
                Danmaku.created_at >= datetime.now(timezone.utc) - timedelta(hours=24),
                Danmaku.room_id.isnot(None),
            )
            .distinct()
        )
        recent_rooms = db.execute(stmt).scalars().all()

        for room_result in recent_rooms:
            room_id = room_result
            try:
                self.analyzer.precompute_analyses(
                    session=db,
                    start_time=start_time,
                    end_time=end_time,
                    room_id=room_id,
                )
                logger.info(f"Precomputed analyses for room {room_id}")
            except Exception as e:
                logger.error(f"Error precomputing analyses for room {room_id}: {e}")
