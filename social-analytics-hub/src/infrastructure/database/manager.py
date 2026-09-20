from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager, contextmanager
from typing import Any

from sqlalchemy import URL, Engine, create_engine
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session, sessionmaker

from src.core.model import PostgreSQLConfig
from src.infrastructure.database.interfaces import DatabaseSessionManager


class PsycopgDbSessionManager(DatabaseSessionManager):
    def __init__(self, config: PostgreSQLConfig) -> None:
        self._config: PostgreSQLConfig = config

        self._sync_engine: Engine | None = None
        self._async_engine: AsyncEngine | None = None

        self._sync_sessionmaker: sessionmaker[Session] | None = None
        self._async_sessionmaker: async_sessionmaker[AsyncSession] | None = None

    # ==================================================
    # URL & Connect Args Builders
    # ==================================================
    def _build_connect_args(self) -> dict[str, Any]:
        connect_args = {}
        if self._config.dbschema:
            connect_args["options"] = f"-csearch_path={self._config.dbschema}"
        return connect_args

    def _build_sync_url(self) -> URL:
        return URL.create(
            drivername="postgresql+psycopg",
            username=self._config.username,
            password=self._config.password,
            host=self._config.host,
            port=self._config.port,
            database=self._config.database,
        )

    def _build_async_url(self) -> URL:
        return URL.create(
            drivername="postgresql+psycopg",
            username=self._config.username,
            password=self._config.password,
            host=self._config.host,
            port=self._config.port,
            database=self._config.database,
        )

    # ==================================================
    # Engine Builders
    # ==================================================
    def _build_sync_engine(self) -> Engine:
        return create_engine(
            self._build_sync_url(),
            echo=self._config.echo,
            pool_size=self._config.pool_size,
            max_overflow=self._config.max_overflow,
            pool_timeout=self._config.pool_timeout,
            pool_recycle=self._config.pool_recycle,
            pool_pre_ping=self._config.pool_pre_ping,
            connect_args=self._build_connect_args(),
        )

    def _build_async_engine(self) -> AsyncEngine:
        return create_async_engine(
            self._build_async_url(),
            echo=self._config.echo,
            pool_size=self._config.pool_size,
            max_overflow=self._config.max_overflow,
            pool_timeout=self._config.pool_timeout,
            pool_recycle=self._config.pool_recycle,
            pool_pre_ping=self._config.pool_pre_ping,
            connect_args=self._build_connect_args(),
        )

    # ==================================================
    # Lifecycle
    # ==================================================
    async def startup(self) -> None:
        if self._sync_engine is None:
            self._sync_engine = self._build_sync_engine()
            self._sync_sessionmaker = sessionmaker(
                bind=self._sync_engine,
                autoflush=False,
                expire_on_commit=False,
            )

        if self._async_engine is None:
            self._async_engine = self._build_async_engine()
            self._async_sessionmaker = async_sessionmaker(
                bind=self._async_engine,
                autoflush=False,
                expire_on_commit=False,
            )

    async def shutdown(self) -> None:
        if self._sync_engine is not None:
            self._sync_engine.dispose()
            self._sync_engine = None
            self._sync_sessionmaker = None

        if self._async_engine is not None:
            await self._async_engine.dispose()
            self._async_engine = None
            self._async_sessionmaker = None

    # ==================================================
    # Public API
    # ==================================================
    @contextmanager
    def sync_session(self) -> Iterator[Session]:
        session = self._require_sync_sessionmaker()()
        try:
            yield session
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @contextmanager
    def sync_uow(self) -> Iterator[Session]:
        session = self._require_sync_sessionmaker()()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @asynccontextmanager
    async def async_session(self) -> AsyncIterator[AsyncSession]:
        session = self._require_async_sessionmaker()()
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    @asynccontextmanager
    async def async_uow(self) -> AsyncIterator[AsyncSession]:
        session = self._require_async_sessionmaker()()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    # ==================================================
    # Internal
    # ==================================================
    def _require_sync_sessionmaker(self) -> sessionmaker[Session]:
        if self._sync_sessionmaker is None:
            raise RuntimeError(
                "PsycopgDatabaseSessionManager is not started. "
                "Call startup() or initialize DI resources first."
            )
        return self._sync_sessionmaker

    def _require_async_sessionmaker(self) -> async_sessionmaker[AsyncSession]:
        if self._async_sessionmaker is None:
            raise RuntimeError(
                "PsycopgDatabaseSessionManager is not started. "
                "Call startup() or initialize DI resources first."
            )
        return self._async_sessionmaker
