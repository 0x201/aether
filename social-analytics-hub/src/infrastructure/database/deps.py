from collections.abc import AsyncIterator, Iterator
from typing import Annotated

from dependency_injector.containers import Container
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from src.database.interfaces import DatabaseSessionManager


def get_container(request: Request) -> Container:
    container = getattr(request.app.state, "container", None)
    if container is None:
        raise RuntimeError("DI container is not attached to app.state")
    return container


def get_db_manager(
    container: Container = Depends(get_container),
) -> DatabaseSessionManager:
    return container.db_manager()


def get_sync_session(
    manager: DatabaseSessionManager = Depends(get_db_manager),
) -> Iterator[Session]:
    with manager.sync_session() as session:
        yield session


def get_sync_uow(
    manager: DatabaseSessionManager = Depends(get_db_manager),
) -> Iterator[Session]:
    with manager.sync_uow() as session:
        yield session


async def get_async_session(
    manager: DatabaseSessionManager = Depends(get_db_manager),
) -> AsyncIterator[AsyncSession]:
    async with manager.async_session() as session:
        yield session


async def get_async_uow(
    manager: DatabaseSessionManager = Depends(get_db_manager),
) -> AsyncIterator[AsyncSession]:
    async with manager.async_uow() as session:
        yield session


SyncSessionDep = Annotated[Session, Depends(get_sync_session)]
SyncUowDep = Annotated[Session, Depends(get_sync_uow)]
AsyncSessionDep = Annotated[AsyncSession, Depends(get_async_session)]
AsyncUowDep = Annotated[AsyncSession, Depends(get_async_uow)]
