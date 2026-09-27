"""基础设施层：ORM 模型 ↔ 领域实体映射测试。"""

from datetime import UTC, datetime

from src.domain.danmaku.entities import (
    CaptureJobEntity,
    DanmakuAnalysisEntity,
    DanmakuEntity,
)
from src.domain.danmaku.value_objects import CaptureJobStatus
from src.infrastructure.persistence.mappers.danmaku_mapper import (
    to_capture_job_entity,
    to_capture_job_model,
    to_danmaku_analysis_entity,
    to_danmaku_analysis_model,
    to_danmaku_entity,
    to_danmaku_model,
)
from src.infrastructure.persistence.models.capture_job import CaptureJobModel
from src.infrastructure.persistence.models.danmaku import DanmakuModel
from src.infrastructure.persistence.models.danmaku_analysis import (
    DanmakuAnalysisModel,
)

NOW = datetime(2023, 1, 1, tzinfo=UTC)


class TestDanmakuMapping:
    def test_model_to_entity_keeps_all_fields(self):
        model = DanmakuModel(
            id=1,
            user_id="u1",
            user_name="alice",
            content="hello",
            fan_medal_name="勋章",
            fan_medal_level=3,
            user_level=12,
            room_id=100,
            created_at=NOW,
        )

        entity = to_danmaku_entity(model)

        assert entity == DanmakuEntity(
            id=1,
            user_id="u1",
            user_name="alice",
            content="hello",
            room_id=100,
            fan_medal_name="勋章",
            fan_medal_level=3,
            user_level=12,
            created_at=NOW,
        )

    def test_entity_to_model_omits_primary_key_when_new(self):
        entity = DanmakuEntity(
            id=None,
            user_id="u1",
            user_name="alice",
            content="hello",
            room_id=100,
            fan_medal_name=None,
            fan_medal_level=None,
            user_level=None,
            created_at=NOW,
        )

        model = to_danmaku_model(entity)

        assert model.user_name == "alice"
        assert model.room_id == 100
        assert model.id is None

    def test_entity_to_model_keeps_primary_key_when_present(self):
        entity = DanmakuEntity(
            id=42,
            user_id=None,
            user_name=None,
            content=None,
            room_id=None,
            fan_medal_name=None,
            fan_medal_level=None,
            user_level=None,
            created_at=NOW,
        )
        assert to_danmaku_model(entity).id == 42


class TestCaptureJobMapping:
    def make_entity(self, status: CaptureJobStatus) -> CaptureJobEntity:
        return CaptureJobEntity(
            id=1,
            room_id=100,
            status=status,
            duration=300,
            start_time=NOW,
            end_time=None,
            created_at=NOW,
        )

    def test_model_to_entity_converts_status_to_enum(self):
        model = CaptureJobModel(
            id=1,
            room_id=100,
            status="Running",
            duration=300,
            start_time=NOW,
            end_time=None,
            created_at=NOW,
        )

        entity = to_capture_job_entity(model)

        assert entity.status is CaptureJobStatus.RUNNING
        assert entity.is_active()

    def test_entity_to_model_stores_status_value(self):
        model = to_capture_job_model(self.make_entity(CaptureJobStatus.COMPLETED))
        assert model.status == "Completed"


class TestDanmakuAnalysisMapping:
    def test_round_trip(self):
        model = DanmakuAnalysisModel(
            id=1,
            room_id=100,
            start_time=NOW,
            end_time=NOW,
            type="combined_analysis",
            frequencies='[["主播", 3]]',
            created_at=NOW,
        )

        entity = to_danmaku_analysis_entity(model)

        assert entity.frequencies_count() == 1
        assert to_danmaku_analysis_model(entity).type == "combined_analysis"

    def test_entity_to_model_omits_primary_key_when_new(self):
        entity = DanmakuAnalysisEntity(
            id=None,
            room_id=None,
            start_time=NOW,
            end_time=NOW,
            type="combined_analysis",
            frequencies=None,
            created_at=NOW,
        )
        assert to_danmaku_analysis_model(entity).id is None
