"""接口层测试：路由契约与错误分支。

通过覆盖 FastAPI 依赖注入来替换用例处理器，不触碰容器与基础设施。
"""

from datetime import UTC, datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api import dependencies as deps
from src.api.routers import danmaku as danmaku_router
from src.application.danmaku.dtos import (
    AnalysisRunSummaryDto,
    DanmakuAnalysisDto,
    DanmakuDto,
    DanmakuPageDto,
    DanmakuStatisticsDto,
    WordcloudResultDto,
    WordFrequencyDto,
    WordFrequencyResultDto,
)
from src.domain.danmaku.value_objects import AnalysisPeriod

START = datetime(2023, 1, 1, 12, tzinfo=UTC)
END = datetime(2023, 1, 1, 13, tzinfo=UTC)


class FakeListHandler:
    def __init__(self, result: DanmakuPageDto) -> None:
        self.result = result
        self.queries = []

    def handle(self, query):
        self.queries.append(query)
        return self.result


class FakeStatisticsHandler:
    def __init__(self, result: DanmakuStatisticsDto) -> None:
        self.result = result
        self.queries = []

    def handle(self, query):
        self.queries.append(query)
        return self.result


class FakeGenerateHandler:
    def __init__(self, result=None, error: Exception | None = None) -> None:
        self.result = result
        self.error = error
        self.commands = []

    async def handle(self, command):
        self.commands.append(command)
        if self.error:
            raise self.error
        return self.result


class FakePrecomputeHandler:
    def __init__(self, result=None, error: Exception | None = None) -> None:
        self.result = result
        self.error = error
        self.commands = []

    async def handle(self, command):
        self.commands.append(command)
        if self.error:
            raise self.error
        return self.result


class FakeWordFrequencyHandler:
    def __init__(self, result=None, error: Exception | None = None) -> None:
        self.result = result
        self.error = error
        self.queries = []

    async def handle(self, query):
        self.queries.append(query)
        if self.error:
            raise self.error
        return self.result


class FakeWordcloudHandler(FakeWordFrequencyHandler):
    pass


@pytest.fixture
def handlers() -> dict:
    return {
        "list": FakeListHandler(
            DanmakuPageDto(
                items=[
                    DanmakuDto(
                        id=1,
                        user_id="u1",
                        user_name="alice",
                        content="hello",
                        room_id=100,
                        room_name="测试房间",
                        created_at=START,
                    )
                ],
                total=1,
            )
        ),
        "statistics": FakeStatisticsHandler(
            DanmakuStatisticsDto(
                total_messages=10, unique_users=3, active_rooms=2, peak_hour=20
            )
        ),
        "generate": FakeGenerateHandler(
            DanmakuAnalysisDto(
                room_id=100,
                start_time=START,
                end_time=END,
                period_type=AnalysisPeriod.HOURLY,
                frequencies='[["主播", 3]]',
                frequencies_count=1,
                type="combined_analysis",
                created_at=START,
            )
        ),
        "precompute": FakePrecomputeHandler(
            AnalysisRunSummaryDto(
                start_time=START,
                end_time=END,
                period_type=AnalysisPeriod.HOURLY,
                type="combined_analysis",
                analysed_rooms=4,
                frequencies_count=4,
                created_at=START,
            )
        ),
        "word_frequency": FakeWordFrequencyHandler(
            WordFrequencyResultDto(
                room_id=100,
                start_time=START,
                end_time=END,
                frequencies=[WordFrequencyDto(word="主播", count=3)],
            )
        ),
        "wordcloud": FakeWordcloudHandler(
            WordcloudResultDto(
                room_id=None,
                start_time=START,
                end_time=END,
                words=[
                    WordFrequencyDto(word="主播", count=5),
                    WordFrequencyDto(word="游戏", count="2"),  # type: ignore[arg-type]
                ],
                max_count=5,
            )
        ),
    }


@pytest.fixture
def client(handlers) -> TestClient:
    app = FastAPI()
    app.include_router(danmaku_router.router, prefix="/danmakus")
    app.dependency_overrides[deps.get_list_danmaku_handler] = lambda: handlers["list"]
    app.dependency_overrides[deps.get_danmaku_statistics_handler] = lambda: handlers[
        "statistics"
    ]
    app.dependency_overrides[deps.get_generate_analysis_handler] = lambda: handlers[
        "generate"
    ]
    app.dependency_overrides[deps.get_precompute_all_rooms_handler] = lambda: handlers[
        "precompute"
    ]
    app.dependency_overrides[deps.get_word_frequency_handler] = lambda: handlers[
        "word_frequency"
    ]
    app.dependency_overrides[deps.get_wordcloud_handler] = lambda: handlers["wordcloud"]
    return TestClient(app)


class TestListDanmakuEndpoint:
    def test_returns_items_and_total(self, client):
        response = client.get("/danmakus/")

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["items"][0]["user_name"] == "alice"
        assert body["items"][0]["room_name"] == "测试房间"

    def test_forwards_query_parameters(self, client, handlers):
        client.get(
            "/danmakus/",
            params={
                "page": 2,
                "pageSize": 5,
                "keyword": "hello",
                "roomId": 100,
                "startTime": "2023-01-01T00:00:00Z",
                "endTime": "2023-01-02T00:00:00Z",
                "userLevelMin": 5,
            },
        )

        query = handlers["list"].queries[0]
        assert query.page == 2
        assert query.page_size == 5
        assert query.keyword == "hello"
        assert query.room_id == 100
        assert query.user_level_min == 5
        assert query.start_time == datetime(2023, 1, 1, tzinfo=UTC)

    def test_rejects_page_size_above_limit(self, client):
        assert client.get("/danmakus/", params={"pageSize": 1000}).status_code == 422

    def test_rejects_partial_time_range(self, client):
        response = client.get(
            "/danmakus/", params={"startTime": "2023-01-01T00:00:00Z"}
        )

        assert response.status_code == 400
        assert "together" in response.json()["detail"]

    def test_rejects_invalid_time_format(self, client):
        response = client.get(
            "/danmakus/",
            params={"startTime": "not-a-date", "endTime": "2023-01-02T00:00:00Z"},
        )

        assert response.status_code == 400
        assert "Invalid start_time format" in response.json()["detail"]


class TestStatisticsEndpoint:
    def test_returns_camel_case_fields(self, client):
        response = client.get("/danmakus/statistics")

        assert response.status_code == 200
        assert response.json() == {
            "totalMessages": 10,
            "uniqueUsers": 3,
            "activeRooms": 2,
            "peakHour": 20,
        }

    def test_forwards_filters(self, client, handlers):
        client.get(
            "/danmakus/statistics",
            params={
                "roomId": 7,
                "startTime": "2023-01-01T00:00:00Z",
                "endTime": "2023-01-02T00:00:00Z",
            },
        )

        assert handlers["statistics"].queries[0].room_id == 7

    def test_rejects_invalid_range(self, client):
        response = client.get(
            "/danmakus/statistics",
            params={"startTime": "2023-01-03T00:00:00Z"},
        )
        assert response.status_code == 400


class TestWordFrequencyEndpoint:
    def test_requires_time_range(self, client):
        assert client.get("/danmakus/word-frequency").status_code == 422

    def test_returns_frequencies(self, client):
        response = client.get(
            "/danmakus/word-frequency",
            params={
                "startTime": "2023-01-01T12:00:00Z",
                "endTime": "2023-01-01T13:00:00Z",
                "topN": 5,
                "roomId": 100,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["roomId"] == 100
        assert body["frequencies"] == [{"word": "主播", "count": 3}]

    def test_rejects_reversed_range(self, client):
        response = client.get(
            "/danmakus/word-frequency",
            params={
                "startTime": "2023-01-02T00:00:00Z",
                "endTime": "2023-01-01T00:00:00Z",
            },
        )

        assert response.status_code == 400
        assert "before" in response.json()["detail"]

    def test_maps_value_error_to_400(self, client, handlers):
        handlers["word_frequency"].error = ValueError("top_n must be positive")

        response = client.get(
            "/danmakus/word-frequency",
            params={
                "startTime": "2023-01-01T00:00:00Z",
                "endTime": "2023-01-02T00:00:00Z",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "top_n must be positive"


class TestWordcloudEndpoint:
    def test_normalises_word_weight(self, client):
        response = client.get(
            "/danmakus/wordcloud",
            params={
                "startTime": "2023-01-01T00:00:00Z",
                "endTime": "2023-01-02T00:00:00Z",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["maxCount"] == 5
        assert body["words"][0]["weight"] == 1.0
        assert body["words"][1]["weight"] == 0.4

    def test_requires_time_range(self, client):
        assert client.get("/danmakus/wordcloud").status_code == 422


class TestGenerateAnalysisEndpoint:
    def test_room_scoped_request_returns_analysis(self, client, handlers):
        response = client.post(
            "/danmakus/analysis/generate",
            json={
                "start_time": "2023-01-01T12:00:00Z",
                "end_time": "2023-01-01T13:00:00Z",
                "room_id": 100,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["roomId"] == 100
        assert body["frequenciesCount"] == 1
        assert body["periodType"] == "hourly"
        assert handlers["generate"].commands[0].room_id == 100

    def test_all_rooms_request_uses_precompute_handler(self, client, handlers):
        response = client.post(
            "/danmakus/analysis/generate",
            json={
                "start_time": "2023-01-01T12:00:00Z",
                "end_time": "2023-01-01T13:00:00Z",
            },
        )

        assert response.status_code == 200
        assert response.json()["frequenciesCount"] == 4
        assert handlers["precompute"].commands[0].period is AnalysisPeriod.HOURLY
        assert handlers["generate"].commands == []

    def test_accepts_period_and_top_n(self, client, handlers):
        client.post(
            "/danmakus/analysis/generate",
            json={
                "start_time": "2023-01-01T12:00:00Z",
                "end_time": "2023-01-01T13:00:00Z",
                "room_id": 100,
                "period_type": "daily",
                "top_n": 25,
            },
        )

        command = handlers["generate"].commands[0]
        assert command.period is AnalysisPeriod.DAILY
        assert command.top_n == 25

    def test_missing_time_fields_returns_422(self, client):
        response = client.post(
            "/danmakus/analysis/generate",
            json={"end_time": "2023-01-01T13:00:00Z"},
        )
        assert response.status_code == 422

    def test_invalid_date_format_returns_400(self, client):
        response = client.post(
            "/danmakus/analysis/generate",
            json={
                "start_time": "invalid_date",
                "end_time": "2023-01-01T13:00:00Z",
            },
        )

        assert response.status_code == 400
        assert "Invalid start_time format" in response.json()["detail"]

    def test_reversed_range_returns_400(self, client):
        response = client.post(
            "/danmakus/analysis/generate",
            json={
                "start_time": "2023-01-02T00:00:00Z",
                "end_time": "2023-01-01T00:00:00Z",
            },
        )

        assert response.status_code == 400
        assert "before" in response.json()["detail"]

    def test_unexpected_error_returns_500(self, client, handlers):
        handlers["generate"].error = RuntimeError("Analysis error")

        response = client.post(
            "/danmakus/analysis/generate",
            json={
                "start_time": "2023-01-01T12:00:00Z",
                "end_time": "2023-01-01T13:00:00Z",
                "room_id": 100,
            },
        )

        assert response.status_code == 500
        assert "Analysis error" in response.json()["detail"]

    def test_invalid_period_type_returns_422(self, client):
        response = client.post(
            "/danmakus/analysis/generate",
            json={
                "start_time": "2023-01-01T12:00:00Z",
                "end_time": "2023-01-01T13:00:00Z",
                "period_type": "fortnightly",
            },
        )
        assert response.status_code == 422
