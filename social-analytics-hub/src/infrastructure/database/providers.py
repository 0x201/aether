from __future__ import annotations

from src.core.model import PostgreSQLConfig
from src.infrastructure.database.interfaces import DatabaseSessionManager
from src.infrastructure.database.manager import PsycopgDbSessionManager


class DatabaseManagerProvider:
    def __init__(self, config: PostgreSQLConfig) -> None:
        self._config = config
        self._manager: PsycopgDbSessionManager | None = None

    def __call__(self) -> DatabaseSessionManager:
        if self._manager is None:
            raise RuntimeError(
                "Database manager is not initialized. "
                "Call initialize() during application startup."
            )
        return self._manager

    @property
    def is_initialized(self) -> bool:
        return self._manager is not None

    async def initialize(self) -> DatabaseSessionManager:
        if self._manager is None:
            manager = PsycopgDbSessionManager(self._config)
            await manager.startup()
            self._manager = manager
        return self._manager

    async def dispose(self) -> None:
        if self._manager is not None:
            await self._manager.shutdown()
            self._manager = None
