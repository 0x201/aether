from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import (
    AbstractAsyncContextManager,
    AbstractContextManager,
)

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)
from sqlalchemy.orm import Session


class DatabaseSessionManager(ABC):
    @abstractmethod
    def sync_session(self) -> AbstractContextManager[Session]:
        raise NotImplementedError

    @abstractmethod
    def sync_uow(self) -> AbstractContextManager[Session]:
        raise NotImplementedError

    @abstractmethod
    def async_session(self) -> AbstractAsyncContextManager[AsyncSession]:
        raise NotImplementedError

    @abstractmethod
    def async_uow(self) -> AbstractAsyncContextManager[AsyncSession]:
        raise NotImplementedError
