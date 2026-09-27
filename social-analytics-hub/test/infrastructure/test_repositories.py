"""基础设施层：仓储实现测试（使用假会话，不连接真实数据库）。"""

from datetime import UTC, datetime

from src.domain.danmaku.entities import DanmakuEntity
from src.domain.danmaku.value_objects import CaptureJobStatus
from src.infrastructure.persistence.models.capture_job import CaptureJobModel
from src.infrastructure.persistence.models.danmaku import DanmakuModel
from src.infrastructure.persistence.models.danmaku_analysis import (
    DanmakuAnalysisModel,
)
from src.infrastructure.persistence.models.room import RoomModel
from src.infrastructure.persistence.repositories.capture_job_repository import (
    PostgresCaptureJobRepository,
)
from src.infrastructure.persistence.repositories.danmaku_analysis_repository import (
    PostgresDanmakuAnalysisRepository,
)
from src.infrastructure.persistence.repositories.danmaku_repository import (
    PostgresDanmakuRepository,
)
from test.infrastructure.fakes import (
    FakeManagerProvider,
    FakeResult,
    FakeSession,
    FakeSessionManager,
)

NOW = datetime(2023, 1, 1, tzinfo=UTC)


def make_provider(session: FakeSession) -> FakeManagerProvider:
    """仓储依赖的是"可调用并返回会话管理器"的提供者。"""
    return FakeManagerProvider(FakeSessionManager(session))


def make_danmaku_entity(index: int = 1) -> DanmakuEntity:
    return DanmakuEntity(
        id=None,
        user_id=f"u{index}",
        user_name=f"user{index}",
        content="hello",
        room_id=100,
        fan_medal_name="勋章",
        fan_medal_level=1,
        user_level=10,
        created_at=NOW,
    )


def make_danmaku_model(index: int = 1, room_id: int = 100) -> DanmakuModel:
    return DanmakuModel(
        id=index,
        user_id=f"u{index}",
        user_name=f"user{index}",
        content="hello",
        room_id=room_id,
        fan_medal_name="勋章",
        fan_medal_level=1,
        user_level=10,
        created_at=NOW,
    )


class TestPostgresDanmakuRepositoryCommands:
    def test_add_returns_entity_with_generated_id(self):
        session = FakeSession()
        inner = FakeSessionManager(session)
        manager = FakeManagerProvider(inner)
        repository = PostgresDanmakuRepository(manager)

        result = repository.add(make_danmaku_entity())

        assert result.id == 1
        assert len(session.added) == 1
        assert isinstance(session.added[0], DanmakuModel)
        assert inner.uow_calls == 1

    def test_add_in_batch_maps_entities_to_orm_models(self):
        """回归：旧实现直接把领域实体交给 session.add_all，运行时会报未映射。"""
        session = FakeSession()
        repository = PostgresDanmakuRepository(make_provider(session))

        inserted = repository.add_in_batch(
            [make_danmaku_entity(1), make_danmaku_entity(2)]
        )

        assert inserted == 2
        assert len(session.add_all_calls) == 1
        batch = session.add_all_calls[0]
        assert all(isinstance(item, DanmakuModel) for item in batch)
        assert [item.user_name for item in batch] == ["user1", "user2"]

    def test_add_in_batch_empty_short_circuits(self):
        session = FakeSession()
        inner = FakeSessionManager(session)
        manager = FakeManagerProvider(inner)
        repository = PostgresDanmakuRepository(manager)

        assert repository.add_in_batch([]) == 0
        assert inner.uow_calls == 0

    def test_update_returns_false_without_fields(self):
        session = FakeSession()
        inner = FakeSessionManager(session)
        manager = FakeManagerProvider(inner)
        repository = PostgresDanmakuRepository(manager)

        assert repository.update(1) is False
        assert inner.uow_calls == 0

    def test_update_returns_true_when_row_touched(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[(1,)]))
        repository = PostgresDanmakuRepository(make_provider(session))

        assert repository.update(1, content="updated") is True

    def test_delete_returns_true_when_row_touched(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[(1,)]))
        repository = PostgresDanmakuRepository(make_provider(session))

        assert repository.delete(1) is True


class TestPostgresDanmakuRepositoryQueries:
    def test_get_by_id_maps_model_to_entity(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[make_danmaku_model()]))
        repository = PostgresDanmakuRepository(make_provider(session))

        entity = repository.get_by_id(1)

        assert entity is not None
        assert entity.user_name == "user1"

    def test_get_by_id_returns_none_when_missing(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[]))
        repository = PostgresDanmakuRepository(make_provider(session))

        assert repository.get_by_id(999) is None

    def test_search_returns_domain_projections(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[(make_danmaku_model(), "测试房间")]))
        repository = PostgresDanmakuRepository(make_provider(session))

        rows = repository.search(keyword="hello", limit=5, offset=0)

        assert len(rows) == 1
        assert rows[0].room_name == "测试房间"
        assert rows[0].danmaku.user_name == "user1"
        assert rows[0].room_id == 100

    def test_count_returns_zero_when_scalar_is_none(self):
        session = FakeSession()
        session.queue_result(FakeResult(scalar_value=None))
        repository = PostgresDanmakuRepository(make_provider(session))

        assert repository.count() == 0

    def test_count_returns_scalar(self):
        session = FakeSession()
        session.queue_result(FakeResult(scalar_value=42))
        repository = PostgresDanmakuRepository(make_provider(session))

        assert repository.count(room_id=100) == 42

    def test_get_peak_hour_returns_none_when_empty(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[]))
        repository = PostgresDanmakuRepository(make_provider(session))

        assert repository.get_peak_hour() is None

    def test_get_recent_room_ids_returns_plain_list(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[1, 2, 3]))
        repository = PostgresDanmakuRepository(make_provider(session))

        room_ids = repository.get_recent_room_ids()

        assert room_ids == [1, 2, 3]
        assert isinstance(room_ids, list)

    def test_get_recent_maps_models(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[make_danmaku_model()]))
        repository = PostgresDanmakuRepository(make_provider(session))

        rows = repository.get_recent(limit=10, offset=0)

        assert [row.id for row in rows] == [1]


class TestPostgresCaptureJobRepository:
    def make_model(self, status: str = "Running") -> CaptureJobModel:
        return CaptureJobModel(
            id=1,
            room_id=100,
            status=status,
            duration=300,
            start_time=NOW,
            end_time=None,
            created_at=NOW,
        )

    def test_get_list_applies_status_filter(self):
        """回归：旧实现的 `stmt.where(...)` 未赋值，过滤会静默失效。"""
        session = FakeSession()
        session.queue_result(FakeResult(rows=[self.make_model()]))
        repository = PostgresCaptureJobRepository(make_provider(session))

        rows = repository.get_list(status=CaptureJobStatus.RUNNING)

        assert len(rows) == 1
        assert rows[0].status is CaptureJobStatus.RUNNING
        compiled = str(session.executed[0].compile())
        assert "capture_jobs.status" in compiled

    def test_get_active_uses_active_statuses(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[self.make_model()]))
        repository = PostgresCaptureJobRepository(make_provider(session))

        rows = repository.get_active()

        assert len(rows) == 1
        compiled = str(session.executed[0].compile())
        assert "IN (" in compiled.upper()

    def test_search_returns_items_and_total(self):
        session = FakeSession()
        session.queue_result(FakeResult(scalar_value=7))
        session.queue_result(FakeResult(rows=[self.make_model("Completed")]))
        repository = PostgresCaptureJobRepository(make_provider(session))

        rows, total = repository.search(page=2, limit=5)

        assert total == 7
        assert len(rows) == 1

    def test_update_status_warns_and_returns_false_when_missing(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[]))
        repository = PostgresCaptureJobRepository(make_provider(session))

        assert repository.update_status(999, CaptureJobStatus.FAILED) is False

    def test_update_status_returns_true_when_touched(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[(1,)]))
        repository = PostgresCaptureJobRepository(make_provider(session))

        assert repository.update_status(1, CaptureJobStatus.COMPLETED) is True


class TestPostgresDanmakuAnalysisRepository:
    def make_model(self) -> DanmakuAnalysisModel:
        return DanmakuAnalysisModel(
            id=1,
            room_id=100,
            start_time=NOW,
            end_time=NOW,
            type="combined_analysis",
            frequencies='[["主播", 2]]',
            created_at=NOW,
        )

    def test_add_returns_entity_with_id(self):
        session = FakeSession()
        repository = PostgresDanmakuAnalysisRepository(make_provider(session))

        from src.domain.danmaku.entities import DanmakuAnalysisEntity

        result = repository.add(
            DanmakuAnalysisEntity(
                id=None,
                room_id=100,
                start_time=NOW,
                end_time=NOW,
                type="combined_analysis",
                frequencies=None,
                created_at=NOW,
            )
        )

        assert result.id == 1
        assert isinstance(session.added[0], DanmakuAnalysisModel)

    def test_get_analysis_returns_none_when_missing(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[]))
        repository = PostgresDanmakuAnalysisRepository(make_provider(session))

        assert repository.get_analysis(room_id=100) is None

    def test_get_analysis_maps_model(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[self.make_model()]))
        repository = PostgresDanmakuAnalysisRepository(make_provider(session))

        entity = repository.get_analysis(room_id=100)

        assert entity is not None
        assert entity.frequencies_count() == 1

    def test_list_analyses_returns_all_mapped(self):
        session = FakeSession()
        session.queue_result(FakeResult(rows=[self.make_model(), self.make_model()]))
        repository = PostgresDanmakuAnalysisRepository(make_provider(session))

        entities = repository.list_analyses(limit=10)

        assert len(entities) == 2


class TestRoomModelIsAvailableForJoin:
    def test_room_model_table_name(self):
        assert RoomModel.__tablename__ == "rooms"
