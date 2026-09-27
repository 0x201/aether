"""共享工具：`DatabaseUtils` 与 `ObjectPool` 测试。"""

from sqlalchemy import select

from src.infrastructure.persistence.models.danmaku import DanmakuModel
from src.infrastructure.persistence.models.room import RoomModel
from src.shared import DatabaseUtils, ObjectPool, ObjectPoolStats


class TestDatabaseUtils:
    def test_init_with_model_class(self):
        assert DatabaseUtils(DanmakuModel).model_class is DanmakuModel

    def test_no_sort_string_leaves_statement_untouched(self):
        stmt = select(DanmakuModel)
        assert "ORDER BY" not in str(DatabaseUtils(DanmakuModel).apply_order_by(stmt))

    def test_single_field_defaults_to_desc(self):
        stmt = DatabaseUtils(DanmakuModel).apply_order_by(
            select(DanmakuModel), "user_name"
        )
        assert "ORDER BY danmakus.user_name DESC" in str(stmt)

    def test_single_field_asc(self):
        stmt = DatabaseUtils(DanmakuModel).apply_order_by(
            select(DanmakuModel), "user_name asc"
        )
        assert "ORDER BY danmakus.user_name ASC" in str(stmt)

    def test_multiple_fields_mixed_directions(self):
        stmt = DatabaseUtils(DanmakuModel).apply_order_by(
            select(DanmakuModel), "user_name desc, content asc"
        )
        sql = str(stmt)
        assert "danmakus.user_name DESC" in sql
        assert "danmakus.content ASC" in sql

    def test_implicit_direction_applies_to_preceding_field(self):
        stmt = DatabaseUtils(DanmakuModel).apply_order_by(
            select(DanmakuModel), "user_name, content desc"
        )
        sql = str(stmt)
        assert "danmakus.user_name DESC" in sql
        assert "danmakus.content DESC" in sql

    def test_unknown_field_falls_back_to_default_order(self):
        stmt = DatabaseUtils(DanmakuModel).apply_order_by(
            select(DanmakuModel), "nonexistent_field"
        )
        assert "ORDER BY danmakus.created_at DESC" in str(stmt)

    def test_works_with_room_model(self):
        stmt = DatabaseUtils(RoomModel).apply_order_by(
            select(RoomModel), "room_name asc"
        )
        assert "ORDER BY rooms.room_name ASC" in str(stmt)


class TestObjectPool:
    def test_creates_objects_on_demand(self):
        pool = ObjectPool(factory=list, size=2)

        first = pool.acquire()
        second = pool.acquire()

        assert first is not second
        assert pool.get_stats().total_created == 2

    def test_reuses_released_objects(self):
        pool = ObjectPool(factory=list, size=2)
        obj = pool.acquire()
        pool.release(obj)

        assert pool.acquire() is obj
        assert pool.get_stats().total_released == 1

    def test_prepopulate_creates_objects_upfront(self):
        pool = ObjectPool(factory=list, size=3, prepopulate=True)

        assert pool.current_size() == 3
        assert pool.get_stats().total_created == 3

    def test_does_not_exceed_configured_size(self):
        pool = ObjectPool(factory=list, size=1)
        pool.release([])
        pool.release([])

        assert pool.current_size() == 1

    def test_reset_func_is_applied_on_release(self):
        pool = ObjectPool(factory=dict, size=1, reset_func=dict.clear)
        obj = {"a": 1}
        pool.release(obj)

        assert pool.acquire() == {}

    def test_get_stats_returns_a_copy(self):
        pool = ObjectPool(factory=list, size=1)
        stats = pool.get_stats()
        stats.total_acquired = 99

        assert pool.get_stats().total_acquired == 0
        assert isinstance(stats, ObjectPoolStats)

    def test_reset_stats_and_close(self):
        pool = ObjectPool(factory=list, size=2, prepopulate=True)
        pool.acquire()

        pool.reset_stats()
        assert pool.get_stats().total_acquired == 0

        pool.close()
        assert pool.current_size() == 0

    def test_peak_pool_size_starts_at_configured_capacity(self):
        assert ObjectPool(factory=list, size=5).get_stats().peak_pool_size == 5

    def test_peak_pool_size_never_drops(self):
        pool = ObjectPool(factory=list, size=5)
        pool.release([])
        pool.release([])
        assert pool.current_size() == 2

        pool.acquire()
        pool.acquire()

        assert pool.current_size() == 0
        assert pool.get_stats().peak_pool_size == 5

    def test_thread_safety_lock_exists(self):
        pool = ObjectPool(factory=list, size=1)
        with pool.lock:
            pool.acquire()
        assert pool.get_stats().total_acquired == 1

    def test_release_without_reset_func(self):
        pool = ObjectPool(factory=list, size=1)
        obj = [1, 2, 3]
        pool.release(obj)
        assert pool.acquire() == [1, 2, 3]

    def test_average_pool_size_is_tracked(self):
        pool = ObjectPool(factory=list, size=2, prepopulate=True)
        pool.acquire()
        assert pool.get_stats().average_pool_size > 0

    def test_stats_ignore_unset_timestamps(self):
        pool = ObjectPool(factory=list, size=1)
        assert pool.get_stats().last_acquire_time is None
        assert pool.get_stats().last_release_time is None

    def test_acquire_after_close_recreates(self):
        pool = ObjectPool(factory=list, size=1)
        pool.close()
        assert pool.acquire() == []
