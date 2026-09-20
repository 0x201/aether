from abc import ABC, abstractmethod
from datetime import datetime

from .entities import CaptureJobEntity, DanmakuAnalysisEntity, DanmakuEntity


class DanmakuRepository(ABC):
    @abstractmethod
    def add(self, danmaku: DanmakuEntity) -> DanmakuEntity:
        raise NotImplementedError

    @abstractmethod
    def get_by_room(
        self,
        room_id: int,
        limit: int = 100,
    ) -> list[DanmakuEntity]:
        raise NotImplementedError

    @abstractmethod
    def add_in_bacth(self, danmakus: list[DanmakuEntity]) -> int:
        raise NotImplementedError

    @abstractmethod
    def get_danmaku_by_user(self, user_name: str) -> list[DanmakuEntity]:
        raise NotImplementedError

    @abstractmethod
    def get_recent_room_ids(self) -> list[int]:
        raise NotImplementedError

    @abstractmethod
    def get_danmaku_by_id(self, id: str) -> DanmakuEntity | None:
        raise NotImplementedError


class CaptureJobRepository(ABC):
    @abstractmethod
    def add(self, entity: CaptureJobEntity) -> CaptureJobEntity:
        raise NotImplementedError

    @abstractmethod
    def update_status(
        self, job_id: int, status: str, end_time: datetime | None = None
    ) -> bool:
        raise NotImplementedError

    @abstractmethod
    def get_by_room_id(
        self, room_id: int, status: str | None
    ) -> CaptureJobEntity | None:
        raise NotImplementedError

    @abstractmethod
    def get_list(self, status: str | None) -> list[CaptureJobEntity]:
        raise NotImplementedError

    @abstractmethod
    def search(
        self, page: int, limit: int, sort: str | None = None
    ) -> tuple[list[CaptureJobEntity], int]:
        raise NotImplementedError


class DanmakuAnalysisRepository(ABC):
    @abstractmethod
    def add(self, entity_to_add: DanmakuAnalysisEntity) -> DanmakuAnalysisEntity:
        raise NotImplementedError

    @abstractmethod
    def get_analysis(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        type: str | None = None,
        room_id: int | None = None,
    ) -> DanmakuAnalysisEntity | None:
        raise NotImplementedError
