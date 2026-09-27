"""领域层：实体不变量测试。"""

from datetime import UTC, datetime

from src.domain.danmaku.entities import (
    CaptureJobEntity,
    DanmakuAnalysisEntity,
    DanmakuEntity,
    DanmakuWithRoom,
)
from src.domain.danmaku.value_objects import CaptureJobStatus


def make_danmaku(**overrides) -> DanmakuEntity:
    data = {
        "id": 1,
        "user_id": "u1",
        "user_name": "alice",
        "content": "hello",
        "room_id": 100,
        "fan_medal_name": "勋章",
        "fan_medal_level": 3,
        "user_level": 12,
        "created_at": datetime(2023, 1, 1, tzinfo=UTC),
    }
    data.update(overrides)
    return DanmakuEntity(**data)


class TestDanmakuEntity:
    def test_is_valid_content(self):
        assert make_danmaku(content="hello").is_valid_content()
        assert not make_danmaku(content="").is_valid_content()
        assert not make_danmaku(content="  ").is_valid_content()
        assert not make_danmaku(content=None).is_valid_content()

    def test_has_fan_medal(self):
        assert make_danmaku().has_fan_medal()
        assert not make_danmaku(fan_medal_name=None).has_fan_medal()

    def test_is_from_room(self):
        assert make_danmaku().is_from_room(100)
        assert not make_danmaku().is_from_room(200)


class TestDanmakuWithRoom:
    def test_exposes_room_id_from_projection(self):
        projection = DanmakuWithRoom(danmaku=make_danmaku(room_id=7), room_name="房间")
        assert projection.room_id == 7
        assert projection.room_name == "房间"


def make_job(**overrides) -> CaptureJobEntity:
    data = {
        "id": 1,
        "room_id": 100,
        "status": CaptureJobStatus.RUNNING,
        "duration": 300,
        "start_time": datetime(2023, 1, 1, 10, tzinfo=UTC),
        "end_time": None,
        "created_at": datetime(2023, 1, 1, 10, tzinfo=UTC),
    }
    data.update(overrides)
    return CaptureJobEntity(**data)


class TestCaptureJobEntity:
    def test_is_valid_duration(self):
        assert make_job(duration=0).is_valid_duration()
        assert not make_job(duration=-1).is_valid_duration()

    def test_is_active(self):
        assert make_job(status=CaptureJobStatus.PENDING).is_active()
        assert make_job(status=CaptureJobStatus.RUNNING).is_active()
        assert not make_job(status=CaptureJobStatus.COMPLETED).is_active()

    def test_is_finished(self):
        assert make_job(status=CaptureJobStatus.COMPLETED).is_finished()
        assert make_job(status=CaptureJobStatus.FAILED).is_finished()
        assert not make_job(status=CaptureJobStatus.RUNNING).is_finished()

    def test_elapsed_seconds_uses_now_when_running(self):
        job = make_job()
        now = datetime(2023, 1, 1, 10, 5, tzinfo=UTC)
        assert job.elapsed_seconds(now) == 300

    def test_elapsed_seconds_uses_end_time_when_present(self):
        job = make_job(end_time=datetime(2023, 1, 1, 11, tzinfo=UTC))
        assert job.elapsed_seconds(datetime(2023, 1, 2, tzinfo=UTC)) == 3600


class TestDanmakuAnalysisEntity:
    def make_analysis(self, frequencies: str | None) -> DanmakuAnalysisEntity:
        return DanmakuAnalysisEntity(
            id=1,
            room_id=100,
            start_time=datetime(2023, 1, 1, tzinfo=UTC),
            end_time=datetime(2023, 1, 1, 1, tzinfo=UTC),
            type="combined_analysis",
            frequencies=frequencies,
            created_at=datetime(2023, 1, 1, 2, tzinfo=UTC),
        )

    def test_has_frequencies(self):
        assert self.make_analysis('[["a", 1]]').has_frequencies()
        assert not self.make_analysis(None).has_frequencies()
        assert not self.make_analysis("").has_frequencies()

    def test_frequencies_count(self):
        assert self.make_analysis('[["a", 2], ["b", 1]]').frequencies_count() == 2

    def test_frequencies_count_handles_malformed_payload(self):
        assert self.make_analysis("not-json").frequencies_count() == 0
        assert self.make_analysis('{"a": 1}').frequencies_count() == 0
