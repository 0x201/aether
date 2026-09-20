from collections.abc import AsyncIterator

from src.core.model import PostgreSQLConfig

from .interfaces import DatabaseSessionManager
from .manager import PsycopgDbSessionManager


async def provide_db_manager(
    config: PostgreSQLConfig,
) -> AsyncIterator[DatabaseSessionManager]:
    manager = PsycopgDbSessionManager(config)
    await manager.startup()

    try:
        yield manager
    finally:
        await manager.shutdown()
