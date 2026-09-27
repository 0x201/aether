"""应用层测试夹具：内存实现，避免触碰真实数据库/缓存/消息总线。"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import timedelta

from src.application.danmaku.services import CacheUnavailableError
from src.domain.danmaku.entities import (
    DanmakuAnalysisEntity,
    DanmakuEntity,
    DanmakuWithRoom,
)
from src.domain.danmaku.repositories import (
    DanmakuAnalysisRepository,
    DanmakuRepository,
)
from src.domain.danmaku.services import WordFrequency


class FakeDanmakuRepository(DanmakuRepository):
    def __init__(self, danmakus: list[DanmakuEntity] | None = None) -> None:
        self.danmakus = list(danmakus or [])
        self.room_ids: list[int] = []
        self.search_calls: list[dict] = []
        self.count_search_calls: list[dict] = []
        self.added: list[DanmakuEntity] = []

    def add(self, danmaku: DanmakuEntity) -> DanmakuEntity:
        danmaku.id = len(self.danmakus) + 1
        self.danmakus.append(danmaku)
        self.added.append(danmaku)
        return danmaku

    def add_in_batch(self, danmakus: list[DanmakuEntity]) -> int:
        for danmaku in danmakus:
            self.add(danmaku)
        return len(danmakus)

    def update(
        self,
        danmaku_id,
        user_name=None,
        content=None,
        fan_medal_name=None,
        fan_medal_level=None,
        user_level=None,
    ) -> bool:
        return any(item.id == danmaku_id for item in self.danmakus)

    def delete(self, danmaku_id: int) -> bool:
        return False

    def get_by_id(self, danmaku_id: int) -> DanmakuEntity | None:
        return next((item for item in self.danmakus if item.id == danmaku_id), None)

    def get_by_room(self, room_id: int, limit: int = 100) -> list[DanmakuEntity]:
        return [item for item in self.danmakus if item.room_id == room_id][:limit]

    def get_by_user(self, user_name: str) -> list[DanmakuEntity]:
        return [item for item in self.danmakus if item.user_name == user_name]

    def get_in_time_range(self, start_time, end_time, room_id=None):
        return list(self.danmakus)

    def get_recent(
        self,
        start_time=None,
        end_time=None,
        room_id=None,
        limit: int = 10,
        offset: int = 0,
    ) -> list[DanmakuEntity]:
        return self.danmakus[offset : offset + limit]

    def get_recent_room_ids(self, within_hours: int = 24) -> list[int]:
        return list(self.room_ids)

    def count(self, room_id=None, start_time=None, end_time=None) -> int:
        return len(self.danmakus)

    def count_unique_users(self, room_id=None, start_time=None, end_time=None) -> int:
        return len({item.user_id for item in self.danmakus})

    def count_active_rooms(self, start_time=None, end_time=None) -> int:
        return len({item.room_id for item in self.danmakus})

    def get_peak_hour(self, room_id=None, start_time=None, end_time=None) -> int | None:
        return 20

    def search(self, **kwargs) -> list[DanmakuWithRoom]:
        self.search_calls.append(kwargs)
        limit = kwargs.get("limit", 100)
        offset = kwargs.get("offset", 0)
        return [
            DanmakuWithRoom(danmaku=item, room_name=f"room-{item.room_id}")
            for item in self.danmakus[offset : offset + limit]
        ]

    def count_search(self, **kwargs) -> int:
        self.count_search_calls.append(kwargs)
        return len(self.danmakus)


class FakeAnalysisRepository(DanmakuAnalysisRepository):
    def __init__(self) -> None:
        self.items: list[DanmakuAnalysisEntity] = []
        self.get_analysis_calls: list[dict] = []

    def add(self, entity_to_add: DanmakuAnalysisEntity) -> DanmakuAnalysisEntity:
        entity_to_add.id = len(self.items) + 1
        self.items.append(entity_to_add)
        return entity_to_add

    def get_analysis(self, start_time=None, end_time=None, type=None, room_id=None):
        self.get_analysis_calls.append(
            {
                "start_time": start_time,
                "end_time": end_time,
                "type": type,
                "room_id": room_id,
            }
        )
        return next(
            (
                item
                for item in self.items
                if item.type == type and item.room_id == room_id
            ),
            None,
        )

    def list_analyses(
        self, start_time=None, end_time=None, type=None, room_id=None, limit=100
    ):
        return list(self.items)[:limit]


class FakeCacheClient:
    def __init__(self, store: dict) -> None:
        self.store = store
        self.set_calls: list[tuple] = []
        self.get_calls: list[str] = []

    async def get(self, key: str):
        self.get_calls.append(key)
        return self.store.get(key)

    async def set(self, key: str, value: str, ex: timedelta | None = None):
        self.set_calls.append((key, value, ex))
        self.store[key] = value
        return True

    async def delete(self, key: str):
        self.store.pop(key, None)
        return True


class FakeCacheSession:
    """满足应用层 `CachePort` 协议的内存实现。"""

    def __init__(self, initial: dict | None = None) -> None:
        self.store: dict = dict(initial or {})
        self.client = FakeCacheClient(self.store)

    @asynccontextmanager
    async def get_cache(self) -> AsyncIterator[FakeCacheClient]:
        yield self.client


class UnavailableCacheClient:
    """所有操作都抛缓存不可用错误。"""

    def __init__(self, error: Exception) -> None:
        self._error = error

    async def get(self, key: str):
        raise self._error

    async def set(self, key: str, value: str, ex: timedelta | None = None):
        raise self._error

    async def delete(self, key: str):
        raise self._error


class UnavailableCacheSession:
    """模拟缓存侧超时/连接失败，用于验证降级行为。"""

    def __init__(self, error: Exception | None = None) -> None:
        self.error = error or CacheUnavailableError("cache get timed out after 3s")

    @asynccontextmanager
    async def get_cache(self) -> AsyncIterator[UnavailableCacheClient]:
        yield UnavailableCacheClient(self.error)


class FakeEventBus:
    def __init__(self, result: bool = True) -> None:
        self.result = result
        self.published: list[tuple] = []

    def publish(self, event_type_name: str, event_data: dict) -> bool:
        self.published.append((event_type_name, event_data))
        return self.result


class FakeFrequencyService:
    """可预测的词频服务，避免依赖 jieba。"""

    DEFAULT_TOP_N = 100
    DEFAULT_WORDCLOUD_TOP_N = 200

    def __init__(self, words: list[WordFrequency] | None = None) -> None:
        self.words = words if words is not None else [WordFrequency("主播", 3)]
        self.calls: list[tuple] = []

    def top_words(self, text: str, top_n: int = 100) -> list[WordFrequency]:
        self.calls.append((text, top_n))
        return list(self.words)[:top_n]

    def wordcloud(self, text: str, top_n: int | None = None) -> list[WordFrequency]:
        return self.top_words(text, top_n or self.DEFAULT_WORDCLOUD_TOP_N)
