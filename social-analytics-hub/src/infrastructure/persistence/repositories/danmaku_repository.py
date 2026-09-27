from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, delete, func, or_, select, update

from src.domain.danmaku.entities import DanmakuEntity, DanmakuWithRoom
from src.domain.danmaku.repositories import DanmakuRepository
from src.infrastructure.database.interfaces import DatabaseSessionManager
from src.infrastructure.persistence.mappers.danmaku_mapper import (
    to_danmaku_entity,
    to_danmaku_model,
)
from src.infrastructure.persistence.models.danmaku import DanmakuModel
from src.infrastructure.persistence.models.room import RoomModel
from src.shared import DatabaseUtils


class PostgresDanmakuRepository(DanmakuRepository):
    def __init__(self, db_manager: Callable[[], DatabaseSessionManager]) -> None:
        self.db_manager = db_manager

    # =================================================
    # Commands
    # =================================================
    def add(self, danmaku: DanmakuEntity) -> DanmakuEntity:
        with self.db_manager().sync_uow() as session:
            model = to_danmaku_model(danmaku)
            session.add(model)
            session.flush()
            return to_danmaku_entity(model)

    def add_in_batch(self, danmakus: list[DanmakuEntity]) -> int:
        """批量写入弹幕。领域实体必须先映射为 ORM 模型。"""
        if not danmakus:
            return 0
        with self.db_manager().sync_uow() as session:
            session.add_all([to_danmaku_model(item) for item in danmakus])
        return len(danmakus)

    def update(
        self,
        danmaku_id: int,
        user_name: str | None = None,
        content: str | None = None,
        fan_medal_name: str | None = None,
        fan_medal_level: int | None = None,
        user_level: int | None = None,
    ) -> bool:
        values: dict = {}
        if user_name is not None:
            values["user_name"] = user_name
        if content is not None:
            values["content"] = content
        if fan_medal_name is not None:
            values["fan_medal_name"] = fan_medal_name
        if fan_medal_level is not None:
            values["fan_medal_level"] = fan_medal_level
        if user_level is not None:
            values["user_level"] = user_level

        if not values:
            return False

        with self.db_manager().sync_uow() as session:
            stmt = (
                update(DanmakuModel)
                .where(DanmakuModel.id == danmaku_id)
                .values(**values)
                .returning(DanmakuModel.id)
            )
            return len(session.execute(stmt).fetchall()) > 0

    def delete(self, danmaku_id: int) -> bool:
        with self.db_manager().sync_uow() as session:
            stmt = (
                delete(DanmakuModel)
                .where(DanmakuModel.id == danmaku_id)
                .returning(DanmakuModel.id)
            )
            return len(session.execute(stmt).fetchall()) > 0

    # =================================================
    # Queries
    # =================================================
    def get_by_id(self, danmaku_id: int) -> DanmakuEntity | None:
        with self.db_manager().sync_session() as session:
            model = session.execute(
                select(DanmakuModel).where(DanmakuModel.id == danmaku_id)
            ).scalar_one_or_none()
            return to_danmaku_entity(model) if model else None

    def get_by_room(self, room_id: int, limit: int = 100) -> list[DanmakuEntity]:
        with self.db_manager().sync_session() as session:
            models = (
                session.execute(
                    select(DanmakuModel)
                    .where(DanmakuModel.room_id == room_id)
                    .order_by(DanmakuModel.created_at.desc())
                    .limit(limit)
                )
                .scalars()
                .all()
            )
            return [to_danmaku_entity(model) for model in models]

    def get_by_user(self, user_name: str) -> list[DanmakuEntity]:
        with self.db_manager().sync_session() as session:
            models = (
                session.execute(
                    select(DanmakuModel)
                    .where(DanmakuModel.user_name == user_name)
                    .order_by(DanmakuModel.created_at.desc())
                )
                .scalars()
                .all()
            )
            return [to_danmaku_entity(model) for model in models]

    def get_in_time_range(
        self,
        start_time: datetime,
        end_time: datetime,
        room_id: int | None = None,
    ) -> list[DanmakuEntity]:
        stmt = select(DanmakuModel).where(
            and_(
                DanmakuModel.created_at >= start_time,
                DanmakuModel.created_at <= end_time,
            )
        )
        if room_id is not None:
            stmt = stmt.where(DanmakuModel.room_id == room_id)

        with self.db_manager().sync_session() as session:
            models = session.execute(stmt).scalars().all()
            return [to_danmaku_entity(model) for model in models]

    def get_recent(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        room_id: int | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> list[DanmakuEntity]:
        stmt = select(DanmakuModel)
        if start_time is not None and end_time is not None:
            stmt = stmt.where(
                and_(
                    DanmakuModel.created_at >= start_time,
                    DanmakuModel.created_at <= end_time,
                    DanmakuModel.content.isnot(None),
                )
            )
        if room_id is not None:
            stmt = stmt.where(DanmakuModel.room_id == room_id)

        stmt = stmt.order_by(DanmakuModel.created_at.desc()).offset(offset).limit(limit)
        with self.db_manager().sync_session() as session:
            models = session.execute(stmt).scalars().all()
            return [to_danmaku_entity(model) for model in models]

    def get_recent_room_ids(self, within_hours: int = 24) -> list[int]:
        since = datetime.now(UTC) - timedelta(hours=within_hours)
        stmt = (
            select(DanmakuModel.room_id)
            .where(
                DanmakuModel.created_at >= since,
                DanmakuModel.room_id.isnot(None),
            )
            .distinct()
        )
        with self.db_manager().sync_session() as session:
            return list(session.execute(stmt).scalars().all())

    def count(
        self,
        room_id: int | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(DanmakuModel)
        stmt = self._apply_scope(stmt, room_id, start_time, end_time)
        with self.db_manager().sync_session() as session:
            return session.execute(stmt).scalar() or 0

    def count_unique_users(
        self,
        room_id: int | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> int:
        stmt = select(func.count(func.distinct(DanmakuModel.user_id))).select_from(
            DanmakuModel
        )
        stmt = stmt.where(DanmakuModel.user_id.isnot(None))
        stmt = self._apply_scope(stmt, room_id, start_time, end_time)
        with self.db_manager().sync_session() as session:
            return session.execute(stmt).scalar() or 0

    def count_active_rooms(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> int:
        stmt = select(func.count(func.distinct(DanmakuModel.room_id))).select_from(
            DanmakuModel
        )
        stmt = stmt.where(DanmakuModel.room_id.isnot(None))
        stmt = self._apply_scope(stmt, None, start_time, end_time)
        with self.db_manager().sync_session() as session:
            return session.execute(stmt).scalar() or 0

    def get_peak_hour(
        self,
        room_id: int | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> int | None:
        hour = func.extract("hour", DanmakuModel.created_at)
        stmt = select(hour.label("hour"), func.count().label("total")).select_from(
            DanmakuModel
        )
        stmt = self._apply_scope(stmt, room_id, start_time, end_time)
        stmt = stmt.group_by(hour).order_by(func.count().desc()).limit(1)

        with self.db_manager().sync_session() as session:
            row = session.execute(stmt).first()
            if row is None or row.total == 0:
                return None
            return int(row.hour)

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
        stmt = select(DanmakuModel, RoomModel.room_name).outerjoin(
            RoomModel, DanmakuModel.room_id == RoomModel.room_id
        )
        conditions = self._build_search_conditions(
            user_name=user_name,
            content=content,
            room_id=room_id,
            start_time=start_time,
            end_time=end_time,
            user_level_min=user_level_min,
            user_level_max=user_level_max,
            fan_medal_level_min=fan_medal_level_min,
            fan_medal_level_max=fan_medal_level_max,
            fan_medal_name=fan_medal_name,
            keyword=keyword,
        )
        if conditions:
            stmt = stmt.where(and_(*conditions))

        db_utils = DatabaseUtils(DanmakuModel)
        if sort:
            stmt = db_utils.apply_order_by(stmt, sort)
        else:
            stmt = stmt.order_by(DanmakuModel.created_at.desc())

        stmt = stmt.limit(limit).offset(offset)

        with self.db_manager().sync_session() as session:
            rows = session.execute(stmt).all()
            return [
                DanmakuWithRoom(
                    danmaku=to_danmaku_entity(row[0]),
                    room_name=row[1],
                )
                for row in rows
            ]

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
        stmt = select(func.count()).select_from(DanmakuModel)
        conditions = self._build_search_conditions(
            user_name=user_name,
            content=content,
            room_id=room_id,
            start_time=start_time,
            end_time=end_time,
            user_level_min=user_level_min,
            user_level_max=user_level_max,
            fan_medal_level_min=fan_medal_level_min,
            fan_medal_level_max=fan_medal_level_max,
            fan_medal_name=fan_medal_name,
            keyword=keyword,
        )
        if conditions:
            stmt = stmt.where(and_(*conditions))

        with self.db_manager().sync_session() as session:
            return session.execute(stmt).scalar() or 0

    # =================================================
    # Internal
    # =================================================
    @staticmethod
    def _apply_scope(
        stmt,
        room_id: int | None,
        start_time: datetime | None,
        end_time: datetime | None,
    ):
        if room_id is not None:
            stmt = stmt.where(DanmakuModel.room_id == room_id)
        if start_time is not None:
            stmt = stmt.where(DanmakuModel.created_at >= start_time)
        if end_time is not None:
            stmt = stmt.where(DanmakuModel.created_at <= end_time)
        return stmt

    @staticmethod
    def _build_search_conditions(
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
    ) -> list:
        conditions = []
        if user_name:
            conditions.append(DanmakuModel.user_name.like(f"%{user_name}%"))
        if content:
            conditions.append(DanmakuModel.content.like(f"%{content}%"))
        if keyword:
            conditions.append(
                or_(
                    DanmakuModel.content.like(f"%{keyword}%"),
                    DanmakuModel.user_name.like(f"%{keyword}%"),
                )
            )
        if room_id is not None:
            conditions.append(DanmakuModel.room_id == room_id)
        if start_time is not None:
            conditions.append(DanmakuModel.created_at >= start_time)
        if end_time is not None:
            conditions.append(DanmakuModel.created_at <= end_time)
        if user_level_min is not None:
            conditions.append(DanmakuModel.user_level >= user_level_min)
        if user_level_max is not None:
            conditions.append(DanmakuModel.user_level <= user_level_max)
        if fan_medal_level_min is not None:
            conditions.append(DanmakuModel.fan_medal_level >= fan_medal_level_min)
        if fan_medal_level_max is not None:
            conditions.append(DanmakuModel.fan_medal_level <= fan_medal_level_max)
        if fan_medal_name:
            conditions.append(DanmakuModel.fan_medal_name.like(f"%{fan_medal_name}%"))
        return conditions
