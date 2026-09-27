"""仓储接口：只接受/返回领域类型，不感知 HTTP、DTO、ORM。"""

from abc import ABC, abstractmethod
from datetime import datetime

from .entities import (
    CaptureJobEntity,
    DanmakuAnalysisEntity,
    DanmakuEntity,
    DanmakuWithRoom,
)
from .value_objects import CaptureJobStatus


class DanmakuRepository(ABC):
    # =================================================
    # Commands
    # =================================================
    @abstractmethod
    def add(self, danmaku: DanmakuEntity) -> DanmakuEntity:
        """持久化单条弹幕，返回带自增主键的实体。"""
        raise NotImplementedError

    @abstractmethod
    def add_in_batch(self, danmakus: list[DanmakuEntity]) -> int:
        """批量持久化弹幕，返回写入条数。"""
        raise NotImplementedError

    @abstractmethod
    def update(
        self,
        danmaku_id: int,
        user_name: str | None = None,
        content: str | None = None,
        fan_medal_name: str | None = None,
        fan_medal_level: int | None = None,
        user_level: int | None = None,
    ) -> bool:
        """按主键局部更新弹幕，返回是否命中记录。"""
        raise NotImplementedError

    @abstractmethod
    def delete(self, danmaku_id: int) -> bool:
        """按主键删除弹幕，返回是否命中记录。"""
        raise NotImplementedError

    # =================================================
    # Queries
    # =================================================
    @abstractmethod
    def get_by_id(self, danmaku_id: int) -> DanmakuEntity | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_room(self, room_id: int, limit: int = 100) -> list[DanmakuEntity]:
        raise NotImplementedError

    @abstractmethod
    def get_by_user(self, user_name: str) -> list[DanmakuEntity]:
        raise NotImplementedError

    @abstractmethod
    def get_in_time_range(
        self,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None = None,
    ) -> list[DanmakuEntity]:
        raise NotImplementedError

    @abstractmethod
    def get_recent(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        room_id: int | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> list[DanmakuEntity]:
        """按创建时间降序读取最近弹幕（供分析批次拉取使用）。"""
        raise NotImplementedError

    @abstractmethod
    def get_recent_room_ids(self, within_hours: int = 24) -> list[int]:
        """读取最近若干小时内有弹幕活动的房间 ID。"""
        raise NotImplementedError

    @abstractmethod
    def count(
        self,
        room_id: int | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> int:
        """统计弹幕总数。"""
        raise NotImplementedError

    @abstractmethod
    def count_unique_users(
        self,
        room_id: int | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> int:
        raise NotImplementedError

    @abstractmethod
    def count_active_rooms(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> int:
        raise NotImplementedError

    @abstractmethod
    def get_peak_hour(
        self,
        room_id: int | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> int | None:
        """返回弹幕量最高的小时（0-23），无数据时返回 None。"""
        raise NotImplementedError

    @abstractmethod
    def search(
        self,
        user_name: str | None = None,
        content: str | None = None,
        room_id: int | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        user_level_min: int | None = None,
        user_level_max: int | None = None,
        fan_medal_level_min: int | None = None,
        fan_medal_level_max: int | None = None,
        fan_medal_name: str | None = None,
        keyword: str | None = None,
        limit: int = 100,
        offset: int = 0,
        sort: str | None = None,
    ) -> list[DanmakuWithRoom]:
        """多条件检索弹幕，结果附带房间名称。

        `content` 只匹配弹幕内容；`keyword` 同时匹配内容与用户名。
        """
        raise NotImplementedError

    @abstractmethod
    def count_search(
        self,
        user_name: str | None = None,
        content: str | None = None,
        room_id: int | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        user_level_min: int | None = None,
        user_level_max: int | None = None,
        fan_medal_level_min: int | None = None,
        fan_medal_level_max: int | None = None,
        fan_medal_name: str | None = None,
        keyword: str | None = None,
    ) -> int:
        """检索命中的总条数（用于分页）。"""
        raise NotImplementedError


class CaptureJobRepository(ABC):
    @abstractmethod
    def add(self, entity: CaptureJobEntity) -> CaptureJobEntity:
        raise NotImplementedError

    @abstractmethod
    def update_status(
        self,
        job_id: int,
        status: CaptureJobStatus,
        end_time: datetime | None = None,
    ) -> bool:
        raise NotImplementedError

    @abstractmethod
    def get_by_room_id(
        self, room_id: int, status: CaptureJobStatus | None = None
    ) -> CaptureJobEntity | None:
        raise NotImplementedError

    @abstractmethod
    def get_list(
        self, status: CaptureJobStatus | None = None
    ) -> list[CaptureJobEntity]:
        raise NotImplementedError

    @abstractmethod
    def get_active(self) -> list[CaptureJobEntity]:
        """读取所有进行中的任务。"""
        raise NotImplementedError

    @abstractmethod
    def search(
        self,
        page: int = 1,
        limit: int = 10,
        sort: str | None = None,
        status: CaptureJobStatus | None = None,
    ) -> tuple[list[CaptureJobEntity], int]:
        """分页读取任务，返回 (当页数据, 总条数)。"""
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

    @abstractmethod
    def list_analyses(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        type: str | None = None,
        room_id: int | None = None,
        limit: int = 100,
    ) -> list[DanmakuAnalysisEntity]:
        raise NotImplementedError
