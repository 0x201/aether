"""基础设施层测试夹具：假会话与假会话管理器。"""

from collections.abc import Iterator
from contextlib import contextmanager


class FakeResult:
    """模拟 SQLAlchemy `Result`。"""

    def __init__(self, rows: list | None = None, scalar_value=None) -> None:
        self._rows = list(rows or [])
        self._scalar = scalar_value

    def fetchall(self) -> list:
        return list(self._rows)

    def first(self):
        return self._rows[0] if self._rows else None

    def scalar(self):
        return self._scalar

    def scalar_one_or_none(self):
        return self._rows[0] if self._rows else None

    def scalars(self) -> FakeResult:
        return self

    def all(self) -> list:
        return list(self._rows)

    def unique(self) -> FakeResult:
        return self


class FakeSession:
    """记录调用并回放预设结果的假会话。"""

    def __init__(self) -> None:
        self.added: list = []
        self.add_all_calls: list[list] = []
        self.executed: list = []
        self.flushed = 0
        self.committed = 0
        self.rolled_back = 0
        self.closed = 0
        self.refreshed: list = []
        self._results: list[FakeResult] = []
        self.next_id = 1

    def queue_result(self, result: FakeResult) -> None:
        self._results.append(result)

    def add(self, instance) -> None:
        self.added.append(instance)
        if getattr(instance, "id", "missing") is None:
            instance.id = self.next_id
            self.next_id += 1

    def add_all(self, instances) -> None:
        items = list(instances)
        self.add_all_calls.append(items)
        for item in items:
            self.add(item)

    def flush(self) -> None:
        self.flushed += 1

    def commit(self) -> None:
        self.committed += 1

    def rollback(self) -> None:
        self.rolled_back += 1

    def close(self) -> None:
        self.closed += 1

    def refresh(self, instance) -> None:
        self.refreshed.append(instance)

    def execute(self, stmt) -> FakeResult:
        self.executed.append(stmt)
        if self._results:
            return self._results.pop(0)
        return FakeResult([])


class FakeSessionManager:
    """满足 `DatabaseSessionManager` 用法的假管理器。"""

    def __init__(self, session: FakeSession | None = None) -> None:
        self.session = session or FakeSession()
        self.uow_calls = 0
        self.session_calls = 0

    @contextmanager
    def sync_session(self) -> Iterator[FakeSession]:
        self.session_calls += 1
        yield self.session

    @contextmanager
    def sync_uow(self) -> Iterator[FakeSession]:
        self.uow_calls += 1
        try:
            yield self.session
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise


class FakeManagerProvider:
    """模拟 `DatabaseManagerProvider`：可调用 + 显式生命周期。

    仓储依赖的是"可调用并返回会话管理器"，与生产代码的
    `DatabaseManagerProvider.__call__` 契约一致。
    """

    def __init__(self, manager: FakeSessionManager | None = None) -> None:
        self.manager = manager or FakeSessionManager()
        self.initialised = 0
        self.disposed = 0

    def __call__(self) -> FakeSessionManager:
        return self.manager

    async def initialize(self) -> FakeSessionManager:
        self.initialised += 1
        return self.manager

    async def dispose(self) -> None:
        self.disposed += 1

    @property
    def is_initialized(self) -> bool:
        return self.initialised > 0
