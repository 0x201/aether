"""基础设施层：缓存、消息总线、数据库管理器与调度策略测试。"""

from datetime import datetime

import pytest

from src.core.config import AppConfig
from src.domain.danmaku.value_objects import AnalysisPeriod
from src.infrastructure.cache import CacheSession
from src.infrastructure.cache.cache_session import CacheClient
from src.infrastructure.messaging import EventBus
from src.infrastructure.schedulers import (
    DailyTimeRangeStrategy,
    HourlyTimeRangeStrategy,
    MonthlyTimeRangeStrategy,
    ScheduledDanmakuAnalyzer,
    TimeRangeStrategyFactory,
    WeeklyTimeRangeStrategy,
    YearlyTimeRangeStrategy,
)


@pytest.fixture
def app_config() -> AppConfig:
    return AppConfig()


class TestCacheSession:
    def test_reads_settings_from_config(self, app_config, mocker):
        redis_mock = mocker.patch(
            "src.infrastructure.cache.cache_session.Redis", return_value=mocker.Mock()
        )

        session = CacheSession(app_config)

        assert session.host == app_config.cache.redis_host
        assert session.port == app_config.cache.redis_port
        redis_mock.assert_not_called()

    async def test_get_cache_yields_and_closes_client(self, app_config, mocker):
        redis_mock = mocker.AsyncMock()
        mocker.patch(
            "src.infrastructure.cache.cache_session.Redis", return_value=redis_mock
        )
        session = CacheSession(app_config)

        async with session.get_cache() as client:
            assert isinstance(client, CacheClient)

        redis_mock.aclose.assert_awaited_once()

    async def test_get_cache_propagates_operations(self, app_config, mocker):
        redis_mock = mocker.AsyncMock()
        redis_mock.get.return_value = b"value"
        mocker.patch(
            "src.infrastructure.cache.cache_session.Redis", return_value=redis_mock
        )
        session = CacheSession(app_config)

        async with session.get_cache() as client:
            assert await client.get("key") == b"value"

        redis_mock.get.assert_awaited_once_with("key")

    async def test_client_is_created_with_socket_timeouts(self, app_config, mocker):
        """缓存不可用时必须快速失败，不能无限期挂起请求。"""
        redis_cls = mocker.patch(
            "src.infrastructure.cache.cache_session.Redis",
            return_value=mocker.AsyncMock(),
        )
        session = CacheSession(app_config)

        async with session.get_cache():
            pass

        kwargs = redis_cls.call_args.kwargs
        assert (
            kwargs["socket_connect_timeout"] == app_config.cache.socket_connect_timeout
        )
        assert kwargs["socket_timeout"] == app_config.cache.socket_timeout
        assert kwargs["socket_timeout"] > 0

    async def test_operation_timeout_is_enforced(self, app_config, mocker):
        """回归：redis-py 不遵守 socket timeout，连接被拒曾耗时 25s+。"""
        import asyncio

        from src.infrastructure.cache.cache_session import CacheUnavailableError

        slow = mocker.AsyncMock()

        async def never_returns(*args, **kwargs):
            await asyncio.sleep(30)

        slow.get.side_effect = never_returns
        mocker.patch("src.infrastructure.cache.cache_session.Redis", return_value=slow)
        app_config.cache.operation_timeout = 0.05
        session = CacheSession(app_config)

        started = asyncio.get_running_loop().time()
        with pytest.raises(CacheUnavailableError, match="timed out"):
            async with session.get_cache() as cache:
                await cache.get("key")
        elapsed = asyncio.get_running_loop().time() - started

        assert elapsed < 1

    async def test_connection_errors_are_wrapped(self, app_config, mocker):
        from src.infrastructure.cache.cache_session import CacheUnavailableError

        broken = mocker.AsyncMock()
        broken.get.side_effect = OSError("connection refused")
        mocker.patch(
            "src.infrastructure.cache.cache_session.Redis", return_value=broken
        )
        session = CacheSession(app_config)

        with pytest.raises(CacheUnavailableError, match="failed"):
            async with session.get_cache() as cache:
                await cache.get("key")

    async def test_client_is_closed_with_aclose(self, app_config, mocker):
        redis_mock = mocker.AsyncMock()
        mocker.patch(
            "src.infrastructure.cache.cache_session.Redis", return_value=redis_mock
        )

        async with CacheSession(app_config).get_cache():
            pass

        redis_mock.aclose.assert_awaited_once()


class TestEventBus:
    def test_uses_configured_exchange(self, app_config):
        assert EventBus(app_config).exchange_name == app_config.messaging.exchange

    def test_publish_returns_false_without_channel(self, app_config, mocker):
        bus = EventBus(app_config)
        mocker.patch.object(bus, "_create_connection", return_value=(None, None))

        assert bus.publish("SomeEvent", {"a": 1}) is False

    def test_publish_sends_json_body(self, app_config, mocker):
        bus = EventBus(app_config)
        channel = mocker.Mock()
        connection = mocker.Mock(is_closed=False)
        mocker.patch.object(
            bus, "_create_connection", return_value=(connection, channel)
        )

        assert bus.publish("SomeEvent", {"message": "中文"}) is True

        kwargs = channel.basic_publish.call_args.kwargs
        assert kwargs["routing_key"] == "SomeEvent"
        assert "中文" in kwargs["body"]
        connection.close.assert_called_once()

    def test_publish_returns_false_on_channel_error(self, app_config, mocker):
        bus = EventBus(app_config)
        channel = mocker.Mock()
        channel.basic_publish.side_effect = RuntimeError("boom")
        mocker.patch.object(
            bus, "_create_connection", return_value=(mocker.Mock(), channel)
        )

        assert bus.publish("SomeEvent", {}) is False


class TestScheduledDanmakuAnalyzer:
    def build(self, analyzer=None) -> ScheduledDanmakuAnalyzer:
        return ScheduledDanmakuAnalyzer(danmaku_analyzer=analyzer or pytest.Mock())

    def test_hourly_strategy(self):
        start, end = HourlyTimeRangeStrategy().calculate_time_range(
            datetime(2023, 1, 1, 14, 30, 45)
        )
        assert (start, end) == (datetime(2023, 1, 1, 13), datetime(2023, 1, 1, 14))

    def test_daily_strategy(self):
        start, end = DailyTimeRangeStrategy().calculate_time_range(
            datetime(2023, 1, 2, 14, 30, 45)
        )
        assert (start, end) == (datetime(2023, 1, 1), datetime(2023, 1, 2))

    def test_weekly_strategy(self):
        start, end = WeeklyTimeRangeStrategy().calculate_time_range(
            datetime(2023, 1, 4, 14, 30, 45)
        )
        assert (start, end) == (datetime(2022, 12, 26), datetime(2023, 1, 2))

    def test_monthly_strategy(self):
        start, end = MonthlyTimeRangeStrategy().calculate_time_range(
            datetime(2023, 3, 15, 14, 30, 45)
        )
        assert (start, end) == (datetime(2023, 2, 1), datetime(2023, 3, 1))

    def test_monthly_strategy_wraps_year(self):
        start, end = MonthlyTimeRangeStrategy().calculate_time_range(
            datetime(2023, 1, 15)
        )
        assert (start, end) == (datetime(2022, 12, 1), datetime(2023, 1, 1))

    def test_yearly_strategy(self):
        start, end = YearlyTimeRangeStrategy().calculate_time_range(
            datetime(2024, 3, 15)
        )
        assert (start, end) == (datetime(2023, 1, 1), datetime(2024, 1, 1))

    def test_factory_returns_expected_strategy(self):
        assert isinstance(
            TimeRangeStrategyFactory.get_strategy(AnalysisPeriod.HOURLY),
            HourlyTimeRangeStrategy,
        )

    def test_factory_falls_back_to_hourly_for_realtime(self):
        assert isinstance(
            TimeRangeStrategyFactory.get_strategy(AnalysisPeriod.REALTIME),
            HourlyTimeRangeStrategy,
        )

    async def test_execute_precompute_delegates_to_analyzer(self, mocker):
        analyzer = mocker.Mock()
        analyzer.precompute_for_all_rooms = mocker.AsyncMock(return_value=3)
        scheduled = ScheduledDanmakuAnalyzer(danmaku_analyzer=analyzer)

        await scheduled._execute_precompute_analyses(AnalysisPeriod.HOURLY)

        analyzer.precompute_for_all_rooms.assert_awaited_once()

    async def test_precompute_swallows_analyzer_errors(self, mocker):
        analyzer = mocker.Mock()
        analyzer.precompute_for_all_rooms = mocker.AsyncMock(
            side_effect=RuntimeError("boom")
        )
        scheduled = ScheduledDanmakuAnalyzer(danmaku_analyzer=analyzer)

        await scheduled._precompute_analyses(AnalysisPeriod.HOURLY)

    def test_stop_is_safe_when_scheduler_never_started(self, mocker):
        scheduled = ScheduledDanmakuAnalyzer(danmaku_analyzer=mocker.Mock())
        scheduled.stop()


class TestSchedulerLifecycle:
    def test_start_requires_container(self):
        from src.infrastructure import schedulers

        schedulers._container = None
        with pytest.raises(RuntimeError, match="Container not set"):
            schedulers.start_scheduled_tasks()

    def test_start_and_stop_delegate_to_tasks(self, mocker):
        from src.infrastructure import schedulers

        task = mocker.Mock()
        container = mocker.Mock()
        container.scheduled_danmaku_analyzer.return_value = task
        schedulers.set_container(container)

        try:
            schedulers.start_scheduled_tasks()
            task.start.assert_called_once()

            schedulers.stop_scheduled_tasks()
            task.stop.assert_called_once()
        finally:
            schedulers._container = None
            schedulers._scheduled_tasks = []
