"""应用层：查询用例测试。"""

from datetime import UTC, datetime

import pytest

from src.application.danmaku.queries import (
    GetDanmakuStatisticsHandler,
    GetDanmakuStatisticsQuery,
    GetWordcloudHandler,
    GetWordcloudQuery,
    GetWordFrequencyHandler,
    GetWordFrequencyQuery,
    ListDanmakuHandler,
    ListDanmakuQuery,
)
from src.application.danmaku.services import (
    AnalyticsNotificationService,
    DanmakuAnalyzer,
)
from src.domain.danmaku.entities import DanmakuEntity
from test.fakes import (
    FakeAnalysisRepository,
    FakeCacheSession,
    FakeDanmakuRepository,
    FakeEventBus,
    FakeFrequencyService,
)


def make_danmaku(index: int, room_id: int = 100) -> DanmakuEntity:
    return DanmakuEntity(
        id=index,
        user_id=f"u{index}",
        user_name=f"user{index}",
        content=f"content {index}",
        room_id=room_id,
        fan_medal_name="勋章",
        fan_medal_level=1,
        user_level=10,
        created_at=datetime(2023, 1, 1, tzinfo=UTC),
    )


def build_analyzer(
    danmaku_repo=None, analysis_repo=None, cache=None, frequency_service=None
) -> DanmakuAnalyzer:
    return DanmakuAnalyzer(
        danmaku_repo=danmaku_repo or FakeDanmakuRepository(),
        analysis_repo=analysis_repo or FakeAnalysisRepository(),
        notifier=AnalyticsNotificationService(FakeEventBus()),
        cache_session=cache or FakeCacheSession(),
        frequency_service=frequency_service or FakeFrequencyService(),
    )


class TestListDanmakuHandler:
    def test_paginates_and_attaches_room_name(self):
        repository = FakeDanmakuRepository([make_danmaku(i) for i in range(1, 26)])
        handler = ListDanmakuHandler(repository)

        result = handler.handle(ListDanmakuQuery(page=2, page_size=10))

        assert len(result.items) == 10
        assert result.total == 25
        assert result.items[0].id == 11
        assert result.items[0].room_name == "room-100"

    def test_translates_paging_to_offset(self):
        repository = FakeDanmakuRepository([make_danmaku(i) for i in range(1, 8)])
        handler = ListDanmakuHandler(repository)

        handler.handle(ListDanmakuQuery(page=3, page_size=2))

        assert repository.search_calls[0]["offset"] == 4
        assert repository.search_calls[0]["limit"] == 2

    def test_normalises_invalid_page_values(self):
        repository = FakeDanmakuRepository([make_danmaku(1)])
        handler = ListDanmakuHandler(repository)

        result = handler.handle(ListDanmakuQuery(page=0, page_size=0))

        assert result.total == 1
        assert repository.search_calls[0]["offset"] == 0
        assert repository.search_calls[0]["limit"] == 1

    def test_forwards_filters_to_repository(self):
        repository = FakeDanmakuRepository([])
        handler = ListDanmakuHandler(repository)
        start = datetime(2023, 1, 1, tzinfo=UTC)

        handler.handle(
            ListDanmakuQuery(
                keyword="hello",
                user_name="alice",
                room_id=9,
                start_time=start,
                user_level_min=5,
            )
        )

        forwarded = repository.search_calls[0]
        assert forwarded["keyword"] == "hello"
        assert forwarded["user_name"] == "alice"
        assert forwarded["room_id"] == 9
        assert forwarded["start_time"] == start
        assert forwarded["user_level_min"] == 5
        assert repository.count_search_calls[0]["keyword"] == "hello"


class TestGetDanmakuStatisticsHandler:
    def test_returns_aggregated_counts(self):
        repository = FakeDanmakuRepository([make_danmaku(1), make_danmaku(2)])
        handler = GetDanmakuStatisticsHandler(repository)

        result = handler.handle(GetDanmakuStatisticsQuery())

        assert result.total_messages == 2
        assert result.unique_users == 2
        assert result.active_rooms == 1
        assert result.peak_hour == 20


class TestGetWordFrequencyHandler:
    async def test_returns_calculated_frequencies(self):
        frequency_service = FakeFrequencyService()
        handler = GetWordFrequencyHandler(
            build_analyzer(frequency_service=frequency_service)
        )

        result = await handler.handle(
            GetWordFrequencyQuery(
                start_time=datetime(2023, 1, 1, tzinfo=UTC),
                end_time=datetime(2023, 1, 2, tzinfo=UTC),
                room_id=100,
                top_n=5,
            )
        )

        assert result.room_id == 100
        assert [(item.word, item.count) for item in result.frequencies] == [("主播", 3)]
        assert frequency_service.calls[0][1] == 5

    @pytest.mark.parametrize("top_n", [0, -1])
    async def test_rejects_non_positive_top_n(self, top_n):
        handler = GetWordFrequencyHandler(build_analyzer())

        with pytest.raises(ValueError, match="top_n must be a positive integer"):
            await handler.handle(
                GetWordFrequencyQuery(
                    start_time=datetime(2023, 1, 1, tzinfo=UTC),
                    end_time=datetime(2023, 1, 2, tzinfo=UTC),
                    top_n=top_n,
                )
            )


class TestGetWordcloudHandler:
    async def test_returns_words_with_max_count(self):
        from src.domain.danmaku.services import WordFrequency

        frequency_service = FakeFrequencyService(
            [WordFrequency("主播", 5), WordFrequency("游戏", 2)]
        )
        handler = GetWordcloudHandler(
            build_analyzer(frequency_service=frequency_service)
        )

        result = await handler.handle(
            GetWordcloudQuery(
                start_time=datetime(2023, 1, 1, tzinfo=UTC),
                end_time=datetime(2023, 1, 2, tzinfo=UTC),
            )
        )

        assert result.max_count == 5
        assert [item.word for item in result.words] == ["主播", "游戏"]

    async def test_max_count_is_zero_without_words(self):
        handler = GetWordcloudHandler(
            build_analyzer(frequency_service=FakeFrequencyService([]))
        )

        result = await handler.handle(
            GetWordcloudQuery(
                start_time=datetime(2023, 1, 1, tzinfo=UTC),
                end_time=datetime(2023, 1, 2, tzinfo=UTC),
            )
        )

        assert result.max_count == 0
        assert result.words == []
