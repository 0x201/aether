"""领域层：值对象与领域服务测试。"""

from datetime import UTC, datetime

import pytest

from src.domain.danmaku.events import DanmakuAnalysisCompletedDomainEvent
from src.domain.danmaku.services import WordFrequency, WordFrequencyDomainService
from src.domain.danmaku.value_objects import (
    AnalysisPeriod,
    AnalysisType,
    CaptureJobStatus,
    FanMedal,
    TimeRange,
)


class FakeTokenizer:
    """可预测的分词器，避免测试依赖 jieba 词典。"""

    def __init__(self, words: list[str]) -> None:
        self._words = words

    def cut_text(self, text: str) -> list[str]:
        return list(self._words)


class TestFanMedal:
    def test_display_name(self):
        assert FanMedal(name="粉丝牌", level=3).display_name == "粉丝牌 3"

    @pytest.mark.parametrize("name", ["", "   "])
    def test_rejects_empty_name(self, name):
        with pytest.raises(ValueError, match="fan medal name"):
            FanMedal(name=name, level=1)

    def test_rejects_negative_level(self):
        with pytest.raises(ValueError, match="fan medal level"):
            FanMedal(name="勋章", level=-1)

    def test_is_frozen(self):
        medal = FanMedal(name="勋章", level=1)
        with pytest.raises(Exception):
            medal.level = 2  # type: ignore[misc]


class TestTimeRange:
    def test_rejects_start_after_end(self):
        with pytest.raises(ValueError, match="start must be before"):
            TimeRange(start=datetime(2023, 1, 2), end=datetime(2023, 1, 1))

    def test_accepts_equal_bounds(self):
        moment = datetime(2023, 1, 1)
        assert TimeRange(start=moment, end=moment).duration_seconds == 0

    def test_duration_and_contains(self):
        start = datetime(2023, 1, 1, 10, tzinfo=UTC)
        end = datetime(2023, 1, 1, 12, tzinfo=UTC)
        time_range = TimeRange.of(start, end)

        assert time_range.duration_seconds == 7200
        assert time_range.contains(datetime(2023, 1, 1, 11, tzinfo=UTC))
        assert not time_range.contains(datetime(2023, 1, 1, 13, tzinfo=UTC))


class TestAnalysisPeriod:
    def test_scheduled_periods(self):
        assert AnalysisPeriod.HOURLY.is_scheduled
        assert not AnalysisPeriod.REALTIME.is_scheduled

    def test_values_match_http_contract(self):
        assert AnalysisPeriod.HOURLY.value == "hourly"
        assert AnalysisType.COMBINED.value == "combined_analysis"


class TestCaptureJobStatus:
    def test_active_statuses(self):
        assert CaptureJobStatus.active_statuses() == (
            CaptureJobStatus.PENDING,
            CaptureJobStatus.RUNNING,
        )


class TestWordFrequencyDomainService:
    def test_tokenize_filters_stop_words_and_short_words(self):
        service = WordFrequencyDomainService(
            tokenizer=FakeTokenizer(["你好", "的", "a", "世界"])
        )
        assert service.tokenize("ignored") == ["你好", "世界"]

    def test_tokenize_empty_text(self):
        service = WordFrequencyDomainService(tokenizer=FakeTokenizer(["你好"]))
        assert service.tokenize("") == []
        assert service.tokenize("   ") == []

    def test_top_words_orders_by_frequency(self):
        service = WordFrequencyDomainService(
            tokenizer=FakeTokenizer(["主播", "主播", "游戏", "好友"])
        )
        assert service.top_words("ignored", top_n=2) == [
            WordFrequency(word="主播", count=2),
            WordFrequency(word="游戏", count=1),
        ]

    def test_top_words_rejects_non_positive_top_n(self):
        service = WordFrequencyDomainService(tokenizer=FakeTokenizer([]))
        with pytest.raises(ValueError, match="top_n must be a positive integer"):
            service.top_words("ignored", top_n=0)

    def test_wordcloud_uses_more_words_by_default(self):
        words = [f"w{i:03d}" for i in range(300)]
        service = WordFrequencyDomainService(tokenizer=FakeTokenizer(words))

        assert len(service.wordcloud("ignored")) == (
            WordFrequencyDomainService.DEFAULT_WORDCLOUD_TOP_N
        )
        assert len(service.wordcloud("ignored", top_n=5)) == 5


class TestDanmakuAnalysisCompletedDomainEvent:
    def test_to_integration_payload_keeps_consumer_contract(self):
        event = DanmakuAnalysisCompletedDomainEvent(
            room_id=100,
            start_time=datetime(2023, 1, 1, tzinfo=UTC),
            end_time=datetime(2023, 1, 2, tzinfo=UTC),
            analysis_type=AnalysisType.COMBINED,
            period=AnalysisPeriod.DAILY,
            frequencies_count=7,
            completed_at=datetime(2023, 1, 2, 10, tzinfo=UTC),
        )

        payload = event.to_integration_payload()

        assert payload == {
            "roomId": 100,
            "startDate": "2023-01-01T00:00:00+00:00",
            "endDate": "2023-01-02T00:00:00+00:00",
            "periodType": "daily",
            "frequenciesCount": 7,
            "completedAt": "2023-01-02T10:00:00+00:00",
        }
