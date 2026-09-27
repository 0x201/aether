"""应用层：服务与分析用例测试。"""

import json
from datetime import UTC, datetime

import pytest

from src.application.danmaku.commands import (
    GenerateAnalysisCommand,
    GenerateAnalysisHandler,
    PrecomputeAllRoomsCommand,
    PrecomputeAllRoomsHandler,
)
from src.application.danmaku.services import (
    INTEGRATION_EVENT_ANALYTICS_COMPLETED,
    AnalyticsNotificationService,
    DanmakuAnalyzer,
)
from src.domain.danmaku.entities import DanmakuAnalysisEntity, DanmakuEntity
from src.domain.danmaku.services import WordFrequency
from src.domain.danmaku.value_objects import AnalysisPeriod
from test.fakes import (
    FakeAnalysisRepository,
    FakeCacheSession,
    FakeDanmakuRepository,
    FakeEventBus,
    FakeFrequencyService,
    UnavailableCacheSession,
)

START = datetime(2023, 1, 1, 12, tzinfo=UTC)
END = datetime(2023, 1, 1, 13, tzinfo=UTC)


def make_danmaku(index: int, content: str = "hello") -> DanmakuEntity:
    return DanmakuEntity(
        id=index,
        user_id=f"u{index}",
        user_name=f"user{index}",
        content=content,
        room_id=100,
        fan_medal_name=None,
        fan_medal_level=None,
        user_level=1,
        created_at=START,
    )


def build_analyzer(
    danmaku_repo=None,
    analysis_repo=None,
    cache=None,
    event_bus=None,
    frequency_service=None,
) -> DanmakuAnalyzer:
    return DanmakuAnalyzer(
        danmaku_repo=danmaku_repo or FakeDanmakuRepository(),
        analysis_repo=analysis_repo or FakeAnalysisRepository(),
        notifier=AnalyticsNotificationService(event_bus or FakeEventBus()),
        cache_session=cache or FakeCacheSession(),
        frequency_service=frequency_service or FakeFrequencyService(),
    )


class TestAnalyticsNotificationService:
    def test_publishes_integration_event(self):
        event_bus = FakeEventBus(result=True)
        service = AnalyticsNotificationService(event_bus)

        assert service.notify_analytics_completed(
            room_id=123,
            start_date="2023-01-01T00:00:00",
            end_date="2023-01-02T00:00:00",
            period_type="daily",
            frequencies_count=10,
            completed_at="2023-01-02T10:00:00",
        )

        event_name, payload = event_bus.published[0]
        assert event_name == INTEGRATION_EVENT_ANALYTICS_COMPLETED
        assert payload["roomId"] == 123
        assert payload["periodType"] == "daily"

    def test_returns_false_when_publish_fails(self):
        service = AnalyticsNotificationService(FakeEventBus(result=False))

        assert not service.notify_analytics_completed(
            room_id=None,
            start_date="2023-01-01T00:00:00",
            end_date="2023-01-02T00:00:00",
            period_type="daily",
            frequencies_count=0,
            completed_at="2023-01-02T10:00:00",
        )


class TestCacheKey:
    def test_includes_room_id(self):
        key = DanmakuAnalyzer._generate_cache_key("danmaku_analysis", START, END, 123)
        assert key == "danmaku_analysis:2023_01_01_12_00_00:2023_01_01_13_00_00:123"

    def test_uses_all_for_missing_room(self):
        key = DanmakuAnalyzer._generate_cache_key("danmaku_analysis", START, END, None)
        assert key.endswith(":All")


class TestValidation:
    def test_rejects_non_positive_top_n(self):
        analyzer = build_analyzer()
        with pytest.raises(ValueError, match="top_n must be a positive integer"):
            analyzer._validate_inputs(0, START, END, None)

    def test_rejects_negative_room_id(self):
        analyzer = build_analyzer()
        with pytest.raises(ValueError, match="room_id must be a positive integer"):
            analyzer._validate_inputs(10, START, END, -1)

    def test_rejects_reversed_range(self):
        analyzer = build_analyzer()
        with pytest.raises(ValueError, match="start must be before end_time"):
            analyzer._validate_inputs(10, END, START, None)

    @pytest.mark.asyncio
    async def test_generate_analysis_rejects_reversed_range(self):
        analyzer = build_analyzer()
        with pytest.raises(ValueError, match="start must be before"):
            await analyzer.generate_analysis(start_time=END, end_time=START)


class TestGenerateAnalysis:
    @pytest.mark.asyncio
    async def test_returns_cached_payload_without_touching_repository(self):
        cache_key = DanmakuAnalyzer._generate_cache_key(
            "danmaku_analysis", START, END, 100
        )
        cached = json.dumps(
            {
                "frequencies": '[["主播", 2]]',
                "type": "combined_analysis",
                "start_time": START.isoformat(),
                "end_time": END.isoformat(),
                "created_at": START.isoformat(),
                "period_type": "hourly",
                "room_id": 100,
            }
        )
        analysis_repo = FakeAnalysisRepository()
        analyzer = build_analyzer(
            analysis_repo=analysis_repo, cache=FakeCacheSession({cache_key: cached})
        )

        result = await analyzer.generate_analysis(
            start_time=START, end_time=END, room_id=100
        )

        assert result.room_id == 100
        assert result.frequencies_count == 1
        assert analysis_repo.items == []

    @pytest.mark.asyncio
    async def test_persists_caches_and_notifies_on_miss(self):
        analysis_repo = FakeAnalysisRepository()
        cache = FakeCacheSession()
        event_bus = FakeEventBus()
        analyzer = build_analyzer(
            danmaku_repo=FakeDanmakuRepository([make_danmaku(1, "主播好")]),
            analysis_repo=analysis_repo,
            cache=cache,
            event_bus=event_bus,
            frequency_service=FakeFrequencyService([WordFrequency("主播", 1)]),
        )

        result = await analyzer.generate_analysis(
            start_time=START,
            end_time=END,
            room_id=100,
            period_type=AnalysisPeriod.HOURLY,
        )

        assert len(analysis_repo.items) == 1
        assert result.frequencies == '[["主播", 1]]'
        assert result.period_type is AnalysisPeriod.HOURLY
        assert cache.client.set_calls, "分析结果应写入缓存"
        assert event_bus.published[0][1]["roomId"] == 100

    @pytest.mark.asyncio
    async def test_reuses_persisted_analysis(self):
        analysis_repo = FakeAnalysisRepository()
        analysis_repo.items.append(
            DanmakuAnalysisEntity(
                id=1,
                room_id=100,
                start_time=START,
                end_time=END,
                type="combined_analysis",
                frequencies='[["主播", 3]]',
                created_at=START,
            )
        )
        frequency_service = FakeFrequencyService()
        analyzer = build_analyzer(
            analysis_repo=analysis_repo, frequency_service=frequency_service
        )

        result = await analyzer.generate_analysis(
            start_time=START, end_time=END, room_id=100
        )

        assert result.frequencies_count == 1
        assert frequency_service.calls == [], "命中持久化结果时不应重新计算"

    @pytest.mark.asyncio
    async def test_fetch_content_paginates_and_terminates(self):
        """回归：旧实现在此场景会无限循环（每批都从头拉取）。"""

        class PagingRepository(FakeDanmakuRepository):
            def __init__(self) -> None:
                super().__init__()
                self.calls: list[tuple[int, int]] = []

            def get_recent(
                self,
                start_time=None,
                end_time=None,
                room_id=None,
                limit=10,
                offset=0,
            ):
                self.calls.append((offset, limit))
                if offset == 0:
                    return [make_danmaku(i, "主播") for i in range(limit)]
                return []

        repository = PagingRepository()
        frequency_service = FakeFrequencyService()
        analyzer = build_analyzer(
            danmaku_repo=repository, frequency_service=frequency_service
        )

        await analyzer.generate_analysis(start_time=START, end_time=END, room_id=100)

        assert repository.calls == [(0, 1000), (1000, 1000)]
        assert frequency_service.calls[0][0].count("主播") == 1000


class TestWordFrequencyReads:
    @pytest.mark.asyncio
    async def test_reads_from_cache_first(self):
        cache_key = DanmakuAnalyzer._generate_cache_key(
            "danmaku_analysis", START, END, None
        )
        cache = FakeCacheSession(
            {cache_key: json.dumps({"frequencies": '[["主播", 4]]'})}
        )
        frequency_service = FakeFrequencyService()
        analyzer = build_analyzer(cache=cache, frequency_service=frequency_service)

        result = await analyzer.get_word_frequency(START, END)

        assert [(item.word, item.count) for item in result] == [("主播", 4)]
        assert frequency_service.calls == []

    @pytest.mark.asyncio
    async def test_falls_back_to_live_computation(self):
        frequency_service = FakeFrequencyService([WordFrequency("游戏", 2)])
        analyzer = build_analyzer(frequency_service=frequency_service)

        result = await analyzer.get_word_frequency(START, END, top_n=10)

        assert [(item.word, item.count) for item in result] == [("游戏", 2)]
        assert frequency_service.calls == [("", 10)]


class TestPrecompute:
    @pytest.mark.asyncio
    async def test_returns_analysis_dto(self):
        analyzer = build_analyzer()

        dto = await analyzer.precompute_analyses(START, END, room_id=5)

        assert dto.room_id == 5

    @pytest.mark.asyncio
    async def test_precompute_for_all_rooms_counts_successes(self):
        repository = FakeDanmakuRepository([])
        repository.room_ids = [1, 2, 3]
        analyzer = build_analyzer(danmaku_repo=repository)

        analysed = await analyzer.precompute_for_all_rooms(
            AnalysisPeriod.HOURLY, START, END
        )

        assert analysed == 3


class TestCommandHandlers:
    @pytest.mark.asyncio
    async def test_generate_analysis_handler_delegates(self):
        handler = GenerateAnalysisHandler(build_analyzer())

        dto = await handler.handle(
            GenerateAnalysisCommand(start_time=START, end_time=END, room_id=100)
        )

        assert dto.room_id == 100

    @pytest.mark.asyncio
    async def test_precompute_all_rooms_handler_returns_summary(self):
        repository = FakeDanmakuRepository([])
        repository.room_ids = [1, 2]
        handler = PrecomputeAllRoomsHandler(build_analyzer(danmaku_repo=repository))

        summary = await handler.handle(
            PrecomputeAllRoomsCommand(
                start_time=START, end_time=END, period=AnalysisPeriod.DAILY
            )
        )

        assert summary.analysed_rooms == 2
        assert summary.period_type is AnalysisPeriod.DAILY
        assert summary.type == "combined_analysis"


class TestCacheDegradation:
    """缓存是加速手段而非强依赖：不可用时必须降级而不是让请求失败。"""

    @pytest.mark.asyncio
    async def test_generate_analysis_survives_unavailable_cache(self):
        analysis_repo = FakeAnalysisRepository()
        event_bus = FakeEventBus()
        analyzer = build_analyzer(
            analysis_repo=analysis_repo,
            cache=UnavailableCacheSession(),
            event_bus=event_bus,
            frequency_service=FakeFrequencyService([WordFrequency("主播", 2)]),
        )

        result = await analyzer.generate_analysis(
            start_time=START, end_time=END, room_id=100
        )

        assert result.frequencies_count == 1
        assert len(analysis_repo.items) == 1
        assert event_bus.published, "缓存不可用不应阻止完成通知"

    @pytest.mark.asyncio
    async def test_word_frequency_falls_back_to_computation(self):
        frequency_service = FakeFrequencyService([WordFrequency("游戏", 1)])
        analyzer = build_analyzer(
            cache=UnavailableCacheSession(), frequency_service=frequency_service
        )

        result = await analyzer.get_word_frequency(START, END)

        assert [(item.word, item.count) for item in result] == [("游戏", 1)]
        assert frequency_service.calls, "缓存不可用时应回退到实时计算"

    @pytest.mark.asyncio
    async def test_reuses_persisted_analysis_when_cache_is_down(self):
        analysis_repo = FakeAnalysisRepository()
        analysis_repo.items.append(
            DanmakuAnalysisEntity(
                id=1,
                room_id=100,
                start_time=START,
                end_time=END,
                type="combined_analysis",
                frequencies='[["主播", 9]]',
                created_at=START,
            )
        )
        frequency_service = FakeFrequencyService()
        analyzer = build_analyzer(
            analysis_repo=analysis_repo,
            cache=UnavailableCacheSession(),
            frequency_service=frequency_service,
        )

        result = await analyzer.generate_analysis(
            start_time=START, end_time=END, room_id=100
        )

        assert result.frequencies_count == 1
        assert frequency_service.calls == []
