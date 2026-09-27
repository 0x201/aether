"""基础设施层：数据库会话管理器测试。"""

import pytest

from src.core.model import PostgreSQLConfig
from src.infrastructure.database.interfaces import DatabaseSessionManager
from src.infrastructure.database.manager import PsycopgDbSessionManager
from src.infrastructure.database.providers import DatabaseManagerProvider


def make_manager() -> PsycopgDbSessionManager:
    return PsycopgDbSessionManager(
        PostgreSQLConfig(
            host="localhost",
            port=5432,
            username="u",
            password="p",
            database="d",
            dbschema="dydanmaku",
        )
    )


class TestPsycopgDbSessionManager:
    def test_implements_interface(self):
        assert isinstance(make_manager(), DatabaseSessionManager)

    def test_session_before_startup_raises(self):
        manager = make_manager()
        with pytest.raises(RuntimeError, match="not started"):
            with manager.sync_session():
                pass

    async def test_async_session_before_startup_raises(self):
        manager = make_manager()
        with pytest.raises(RuntimeError, match="not started"):
            async with manager.async_uow():
                pass

    async def test_startup_builds_engines_and_shutdown_disposes(self):
        manager = make_manager()

        await manager.startup()
        try:
            assert manager._sync_engine is not None
            assert manager._async_engine is not None
        finally:
            await manager.shutdown()

        assert manager._sync_engine is None
        assert manager._async_engine is None

    def test_connect_args_include_search_path(self):
        manager = make_manager()
        assert manager._build_connect_args() == {"options": "-csearch_path=dydanmaku"}

    def test_connect_args_empty_without_schema(self):
        manager = PsycopgDbSessionManager(PostgreSQLConfig(dbschema=None))
        assert manager._build_connect_args() == {}

    def test_build_urls_use_psycopg_driver(self):
        manager = make_manager()
        assert manager._build_sync_url().drivername == "postgresql+psycopg"
        assert manager._build_async_url().database == "d"


class TestDatabaseManagerProvider:
    def test_raises_before_initialize(self):
        provider = DatabaseManagerProvider(PostgreSQLConfig())

        with pytest.raises(RuntimeError, match="not initialized"):
            provider()

        assert provider.is_initialized is False

    async def test_initialize_is_idempotent_and_dispose_resets(self):
        provider = DatabaseManagerProvider(PostgreSQLConfig())

        manager = await provider.initialize()
        assert provider.is_initialized is True
        assert provider() is manager
        assert await provider.initialize() is manager

        await provider.dispose()
        assert provider.is_initialized is False

        with pytest.raises(RuntimeError, match="not initialized"):
            provider()

    async def test_dispose_without_initialize_is_safe(self):
        await DatabaseManagerProvider(PostgreSQLConfig()).dispose()

    async def test_repositories_can_call_provider(self):
        from src.infrastructure.persistence.repositories.danmaku_repository import (
            PostgresDanmakuRepository,
        )

        provider = DatabaseManagerProvider(PostgreSQLConfig())
        await provider.initialize()
        try:
            repository = PostgresDanmakuRepository(db_manager=provider)
            assert repository.db_manager() is provider()
        finally:
            await provider.dispose()
