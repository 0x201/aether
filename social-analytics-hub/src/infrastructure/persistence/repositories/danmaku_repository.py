from datetime import UTC, datetime, timedelta

from loguru import logger
from sqlalchemy import and_, delete, func, select, update

from src.domain.danmaku.entities import DanmakuEntity
from src.domain.danmaku.repositories import DanmakuRepository
from src.infrastructure.database.manager import PsycopgDbSessionManager
from src.infrastructure.persistence.models.danmaku import (
    DanmakuModel,
)
from src.infrastructure.persistence.models.room import RoomModel
from src.mappers.danmaku import (
    to_danmaku_analysis_dto,
    to_danmaku_dto,
    to_danmaku_with_room_dto,
)
from src.shared import DatabaseUtils


class PostgresDanmakuRepository(DanmakuRepository):
    def __init__(self, db_manager: PsycopgDbSessionManager):
        self.db_manager: PsycopgDbSessionManager = db_manager

    # =================================================
    # Commands
    # =================================================
    def add(self, danmaku: DanmakuEntity) -> DanmakuEntity:
        with self.db_manager.sync_uow() as session:
            model = DanmakuModel(
                user_id=danmaku.user_id,
                user_name=danmaku.user_name,
                content=danmaku.content,
                fan_medal_name=danmaku.fan_medal_name,
                fan_medal_level=danmaku.fan_medal_level,
                user_level=danmaku.user_level,
                room_id=danmaku.room_id,
            )
            session.add(model)
            session.flush()

            danmaku.id = model.id

            return danmaku

    def add_in_batch(self, danmakus: list[DanmakuEntity]) -> int:
        """
        Insert a batch of danmaku into the database

        Args:
            danmakus: List of tuples containing danmaku data in the order:
                        (user_id,
                        user_name,
                        content,
                        fan_medal_name,
                        fan_medal_level,
                        user_level,
                        room_id)

        Returns:
            int: Number of rows inserted
        """
        if not danmakus:
            return 0
        with self.db_manager.sync_uow() as session:
            inserted_count = len(danmakus)
            session.add_all(danmakus)
            return inserted_count

    def update_danmaku(
        self,
        id: str,
        user_name: str | None = None,
        content: str | None = None,
        fan_medal_name: str | None = None,
        fan_medal_level: int | None = None,
        user_level: int | None = None,
    ) -> bool:
        """
        Update an existing danmaku in the database

        Returns:
            bool: True if updated successfully, False otherwise
        """

        with self.db_manager.sync_uow() as session:
            # Build dynamic update query based on provided fields
            values = {}
            if user_name is not None:
                values[DanmakuModel.user_name] = user_name
            if content is not None:
                values[DanmakuModel.content] = content
            if fan_medal_name is not None:
                values[DanmakuModel.fan_medal_name] = fan_medal_name
            if fan_medal_level is not None:
                values[DanmakuModel.fan_medal_level] = fan_medal_level
            if user_level is not None:
                values[DanmakuModel.user_level] = user_level

            # Only proceed if there are fields to update
            if not values:
                return False

            # Using RETURNING clause to check if any rows were affected
            stmt = (
                update(DanmakuModel)
                .where(DanmakuModel.id == id)
                .values(**values)
                .returning(DanmakuModel.id)
            )
            result = session.execute(stmt)
            session.commit()

            # If we got any rows back, the update was successful
            updated_rows = result.fetchall()
            return len(updated_rows) > 0

    def delete(self, id: str) -> bool:
        """
        Delete a danmaku from the database

        Parameters:
            id (str): ID of the danmaku to delete

        Returns:
            bool: True if deleted successfully, False otherwise
        """
        with self.db_manager.sync_uow() as session:
            existing = session.execute(
                select(DanmakuModel).where(DanmakuModel.id == id)
            ).first()
            if not existing:
                return False

            # Delete the danmaku
            stmt = delete(DanmakuModel).where(DanmakuModel.id == id)
            _ = session.execute(stmt)
            return True

    # =================================================
    # Queries
    # =================================================
    def get_danmaku_count(self) -> int:
        with self.db_manager.sync_session() as session:
            stmt = select(func.count()).select_from(DanmakuModel)
            count = session.execute(stmt).scalar()
            return count if count is not None else 0

    def get_recent_danmakus(
        self,
        start_time: datetime | None,
        end_time: datetime | None,
        room_id: int | None,
        limit: int | None = 10,
    ) -> list[DanmakuEntity]:
        with self.db_manager.sync_session() as session:
            stmt = select(DanmakuModel)
            if start_time and end_time:
                stmt = stmt.where(
                    and_(
                        DanmakuModel.created_at >= start_time,
                        DanmakuModel.created_at <= end_time,
                        DanmakuModel.content.isnot(None),
                    )
                )

            if room_id:
                stmt = stmt.where(DanmakuModel.room_id == room_id)

            stmt = stmt.order_by(DanmakuModel.created_at.desc()).limit(limit)
            models = session.execute(stmt).scalars().all()
            return [
                DanmakuEntity(
                    id=model.id,
                    user_id=model.user_id,
                    user_name=model.user_name,
                    content=model.content,
                    room_id=model.room_id,
                    fan_medal_name=model.fan_medal_name,
                    fan_medal_level=model.fan_medal_level,
                    user_level=model.user_level,
                    created_at=model.created_at,
                )
                for model in models
            ]

    def get_recent_room_ids(self) -> list[int]:
        with self.db_manager.sync_session() as session:
            stmt = (
                select(DanmakuModel.room_id)
                .where(
                    DanmakuModel.created_at >= datetime.now(UTC) - timedelta(hours=24),
                    DanmakuModel.room_id.isnot(None),
                )
                .distinct()
            )
            room_ids = session.execute(stmt).scalars().all()

            return room_ids

    def get_danmaku_by_user(self, user_name: str) -> list[DanmakuEntity]:
        with self.db_manager.sync_session() as session:
            stmt = (
                select(DanmakuModel)
                .where(DanmakuModel.user_name == user_name)
                .order_by(DanmakuModel.created_at.desc())
            )
            models = session.execute(stmt).scalars().all()
            return [
                DanmakuEntity(
                    id=model.id,
                    user_id=model.user_id,
                    user_name=model.user_name,
                    content=model.content,
                    room_id=model.room_id,
                    fan_medal_name=model.fan_medal_name,
                    fan_medal_level=model.fan_medal_level,
                    user_level=model.user_level,
                    created_at=model.created_at,
                )
                for model in models
            ]

    def get_by_room(self, room_id: int, limit: int = 100) -> list[DanmakuEntity]:
        with self.db_manager.sync_session() as session:
            stmt = (
                select(DanmakuModel)
                .where(DanmakuModel.room_id == room_id)
                .order_by(DanmakuModel.created_at.desc())
                .limit(limit)
            )
            models = session.execute(stmt).scalars().all()

            return [
                DanmakuEntity(
                    id=model.id,
                    user_id=model.user_id,
                    user_name=model.user_name,
                    content=model.content,
                    room_id=model.room_id,
                    fan_medal_name=model.fan_medal_name,
                    fan_medal_level=model.fan_medal_level,
                    user_level=model.user_level,
                    created_at=model.created_at,
                )
                for model in models
            ]

    def get_danmaku_in_time_range(
        self, start_time: datetime, end_time: datetime, room_id: int | None = None
    ) -> list[DanmakuEntity]:
        query = select(DanmakuModel).where(
            and_(
                DanmakuModel.room_id == room_id,
                DanmakuModel.created_at >= start_time,
                DanmakuModel.created_at <= end_time,
            )
        )
        if room_id:
            query = query.where(DanmakuModel.room_id == room_id)
        with self.db_manager.sync_session() as session:
            models = list(session.execute(query).scalars().all())
            return [
                DanmakuEntity(
                    id=model.id,
                    user_id=model.user_id,
                    user_name=model.user_name,
                    content=model.content,
                    room_id=model.room_id,
                    fan_medal_name=model.fan_medal_name,
                    fan_medal_level=model.fan_medal_level,
                    user_level=model.user_level,
                    created_at=model.created_at,
                )
                for model in models
            ]

    def get_danmaku_by_id(self, id: str) -> DanmakuEntity | None:
        """
        Get a specific danmaku by its id

        Returns:
            Danmaku: Danmaku object if found, None otherwise
        """
        with self.db_manager.sync_session() as session:
            stmt = select(DanmakuModel).where(DanmakuModel.id == id)
            model: DanmakuModel | None = session.execute(stmt).scalars().first()
            return (
                DanmakuEntity(
                    id=model.id,
                    user_id=model.user_id,
                    user_name=model.user_name,
                    content=model.content,
                    room_id=model.room_id,
                    fan_medal_name=model.fan_medal_name,
                    fan_medal_level=model.fan_medal_level,
                    user_level=model.user_level,
                    created_at=model.created_at,
                )
                if model
                else None
            )

    def search_danmaku(
        self,
        user_name: str | None = None,
        content: str | None = None,
        room_id: int | None = None,
        user_level_min: int | None = None,
        user_level_max: int | None = None,
        fan_medal_level_min: int | None = None,
        fan_medal_level_max: int | None = None,
        fan_medal_name: str | None = None,
        limit: int = 100,
        offset: int = 0,
        sort: str | None = None,
    ) -> list[DanmakuWithRoomDto]:
        """
        Search danmaku with various filters and always return room name

        Args:
            user_name: Filter by user name (partial match)
            content: Filter by content (partial match)
            room_id: Filter by room ID
            user_level_min: Minimum user level
            user_level_max: Maximum user level
            fan_medal_level_min: Minimum fan medal level
            fan_medal_level_max: Maximum fan medal level
            fan_medal_name: Fan medal name (partial match)
            limit: Maximum number of results to return
            offset: Number of results to skip
            sort: Sort string in format "field_name direction"
                (e.g., "id desc", "created_at asc")

        Returns:
            List[Tuple[Danmaku, str]]: List of tuples containing (danmaku, room_name)
            matching the criteria
        """
        with self.db_manager.sync_session() as session:
            stmt = select(DanmakuModel, RoomModel.room_name).outerjoin(
                RoomModel, DanmakuModel.room_id == RoomModel.room_id
            )

            conditions = []
            if user_name:
                conditions.append(DanmakuModel.user_name.like(f"%{user_name}%"))
            if content:
                conditions.append(DanmakuModel.content.like(f"%{content}%"))
            if room_id:
                conditions.append(DanmakuModel.room_id == room_id)
            if user_level_min is not None:
                conditions.append(DanmakuModel.user_level >= user_level_min)
            if user_level_max is not None:
                conditions.append(DanmakuModel.user_level <= user_level_max)
            if fan_medal_level_min is not None:
                conditions.append(DanmakuModel.fan_medal_level >= fan_medal_level_min)
            if fan_medal_level_max is not None:
                conditions.append(DanmakuModel.fan_medal_level <= fan_medal_level_max)
            if fan_medal_name is not None:
                conditions.append(DanmakuModel.fan_medal_name.like(f"%{fan_medal_name}%"))

            if conditions:
                stmt = stmt.where(and_(*conditions))

            db_utils = DatabaseUtils(DanmakuModel)
            stmt = db_utils.apply_order_by(stmt, sort)

            stmt = stmt.limit(limit).offset(offset)

            rows = session.execute(stmt).all()

            return [to_danmaku_with_room_dto(row) for row in rows]

    def get_search_count(
        self,
        user_name: str | None = None,
        content: str | None = None,
        room_id: int | None = None,
        user_level_min: int | None = None,
        user_level_max: int | None = None,
        fan_medal_level_min: int | None = None,
        fan_medal_level_max: int | None = None,
        fan_medal_name: str | None = None,
    ) -> int:
        """
        Get count of danmaku matching search criteria

        Returns:
            int: Count of matching danmaku
        """
        with self.db_manager.sync_session() as session:
            # Base query
            stmt = select(func.count()).select_from(DanmakuModel)

            # Add filters
            conditions = []
            if user_name:
                conditions.append(DanmakuModel.user_name.like(f"%{user_name}%"))
            if content:
                conditions.append(DanmakuModel.content.like(f"%{content}%"))
            if room_id:
                conditions.append(DanmakuModel.room_id == room_id)
            if user_level_min is not None:
                conditions.append(DanmakuModel.user_level >= user_level_min)
            if user_level_max is not None:
                conditions.append(DanmakuModel.user_level <= user_level_max)
            if fan_medal_level_min is not None:
                conditions.append(DanmakuModel.fan_medal_level >= fan_medal_level_min)
            if fan_medal_level_max is not None:
                conditions.append(DanmakuModel.fan_medal_level <= fan_medal_level_max)
            if fan_medal_name is not None:
                conditions.append(DanmakuModel.fan_medal_name.like(f"%{fan_medal_name}%"))

            if conditions:
                stmt = stmt.where(and_(*conditions))

            count = session.execute(stmt).scalar()
            return count if count is not None else 0
