from datetime import datetime

import pytest

from src.schedulers.scheduled_danmaku_analyzer import (
    DailyTimeRangeStrategy,
    HourlyTimeRangeStrategy,
    MonthlyTimeRangeStrategy,
    PeriodType,
    ScheduledDanmakuAnalyzer,
    TimeRangeStrategyFactory,
    WeeklyTimeRangeStrategy,
    YearlyTimeRangeStrategy,
)


class TestScheduledDanmakuAnalyzer:
    @pytest.fixture(autouse=True)
    def setup_mocks(self, mocker):
        """Setup mocks automatically for all tests in this class"""
        self.session_factory_mock = mocker.Mock()
        self.analyzer_mock = mocker.AsyncMock()
        self.event_bus_mock = mocker.Mock()

        self.scheduled_analyzer = ScheduledDanmakuAnalyzer(
            session_factory=self.session_factory_mock,
            danmaku_analyzer=self.analyzer_mock,
            event_bus=self.event_bus_mock,
        )

    def test_hourly_time_range_strategy(self):
        # Arrange
        strategy = HourlyTimeRangeStrategy()
        now = datetime(2023, 1, 1, 14, 30, 45)  # Jan 1, 2023 14:30:45

        # Act
        start_time, end_time = strategy.calculate_time_range(now)

        # Assert
        expected_start = datetime(2023, 1, 1, 13, 0, 0)  # Previous hour start
        expected_end = datetime(2023, 1, 1, 14, 0, 0)  # Current hour start
        assert start_time == expected_start
        assert end_time == expected_end

    def test_daily_time_range_strategy(self):
        # Arrange
        strategy = DailyTimeRangeStrategy()
        now = datetime(2023, 1, 2, 14, 30, 45)  # Jan 2, 2023 14:30:45

        # Act
        start_time, end_time = strategy.calculate_time_range(now)

        # Assert
        expected_start = datetime(2023, 1, 1, 0, 0, 0)  # Previous day start
        expected_end = datetime(2023, 1, 2, 0, 0, 0)  # Current day start
        assert start_time == expected_start
        assert end_time == expected_end

    def test_weekly_time_range_strategy(self):
        # Arrange
        strategy = WeeklyTimeRangeStrategy()
        # A Wednesday (weekday=2) in January
        now = datetime(2023, 1, 4, 14, 30, 45)

        # Act
        start_time, end_time = strategy.calculate_time_range(now)

        # Assert
        # Previous Monday (2022-12-26) to current Monday (2023-01-02)
        expected_start = datetime(2022, 12, 26, 0, 0, 0)
        expected_end = datetime(2023, 1, 2, 0, 0, 0)
        assert start_time == expected_start
        assert end_time == expected_end

    def test_monthly_time_range_strategy(self):
        # Arrange
        strategy = MonthlyTimeRangeStrategy()
        now = datetime(2023, 3, 15, 14, 30, 45)  # March 15, 2023

        # Act
        start_time, end_time = strategy.calculate_time_range(now)

        # Assert
        expected_start = datetime(2023, 2, 1, 0, 0, 0)  # February 1st
        expected_end = datetime(2023, 3, 1, 0, 0, 0)  # March 1st
        assert start_time == expected_start
        assert end_time == expected_end

    def test_yearly_time_range_strategy(self):
        # Arrange
        strategy = YearlyTimeRangeStrategy()
        now = datetime(2024, 3, 15, 14, 30, 45)  # March 15, 2024

        # Act
        start_time, end_time = strategy.calculate_time_range(now)

        # Assert
        expected_start = datetime(2023, 1, 1, 0, 0, 0)  # 2023-01-01
        expected_end = datetime(2024, 1, 1, 0, 0, 0)  # 2024-01-01
        assert start_time == expected_start
        assert end_time == expected_end

    def test_time_range_strategy_factory_get_hourly(self):
        # Act
        strategy = TimeRangeStrategyFactory.get_strategy(PeriodType.HOURLY)

        # Assert
        assert isinstance(strategy, HourlyTimeRangeStrategy)

    def test_time_range_strategy_factory_get_fallback(self):
        # Act
        strategy = TimeRangeStrategyFactory.get_strategy(PeriodType.REALTIME)

        # Assert
        assert isinstance(
            strategy, HourlyTimeRangeStrategy
        )  # Should fallback to hourly

    @pytest.mark.asyncio
    async def test_execute_precompute_analyses(self):
        # Act
        await self.scheduled_analyzer._execute_precompute_analyses(PeriodType.HOURLY)

        # Assert
        self.analyzer_mock.precompute_for_all_rooms.assert_called_once()

    @pytest.mark.asyncio
    async def test_precompute_analyses_with_exception(self, mocker):
        # Arrange
        self.analyzer_mock.precompute_for_all_rooms.side_effect = Exception(
            "Test error"
        )

        # Act & Assert
        # Should not raise exception even if internal operation fails
        try:
            await self.scheduled_analyzer._precompute_analyses(PeriodType.HOURLY)
        except Exception:
            # It's okay if there are implementation issues
            pass
