from __future__ import annotations

from collections.abc import Callable
from datetime import datetime

from loguru import logger
from sqlalchemy import and_, func, select, update

from src.domain.danmaku.entities import CaptureJobEntity
from src.domain.danmaku.repositories import CaptureJobRepository
from src.domain.danmaku.value_objects import CaptureJobStatus
from src.infrastructure.database.interfaces import DatabaseSessionManager
from src.infrastructure.persistence.mappers.danmaku_mapper import (
    to_capture_job_entity,
    to_capture_job_model,
)
from src.infrastructure.persistence.models.capture_job import CaptureJobModel
from src.shared import DatabaseUtils


class PostgresCaptureJobRepository(CaptureJobRepository):
    def __init__(self, db_manager: Callable[[], DatabaseSessionManager]) -> None:
        self.db_manager = db_manager

    # =================================================
    # Commands
    # =================================================
    def add(self, entity: CaptureJobEntity) -> CaptureJobEntity:
        with self.db_manager().sync_uow() as session:
            model = to_capture_job_model(entity)
            session.add(model)
            session.flush()
            logger.info(
                f"Created capture job for room {entity.room_id}, ID: {model.id}"
            )
            return to_capture_job_entity(model)

    def update_status(
        self,
        job_id: int,
        status: CaptureJobStatus,
        end_time: datetime | None = None,
    ) -> bool:
        with self.db_manager().sync_uow() as session:
            stmt = (
                update(CaptureJobModel)
                .where(CaptureJobModel.id == job_id)
                .values(status=CaptureJobStatus(status).value, end_time=end_time)
                .returning(CaptureJobModel.id)
            )
            updated = len(session.execute(stmt).fetchall()) > 0

        if updated:
            logger.info(f"Updated capture job {job_id} status to {status}")
        else:
            logger.warning(f"No capture job found with ID {job_id} to update")
        return updated

    # =================================================
    # Queries
    # =================================================
    def get_by_room_id(
        self, room_id: int, status: CaptureJobStatus | None = None
    ) -> CaptureJobEntity | None:
        stmt = select(CaptureJobModel).where(CaptureJobModel.room_id == room_id)
        if status is not None:
            stmt = stmt.where(CaptureJobModel.status == CaptureJobStatus(status).value)

        with self.db_manager().sync_session() as session:
            model = session.execute(stmt).scalars().first()
            return to_capture_job_entity(model) if model else None

    def get_list(
        self, status: CaptureJobStatus | None = None
    ) -> list[CaptureJobEntity]:
        stmt = select(CaptureJobModel)
        if status is not None:
            # 修复旧实现在此处漏赋值导致过滤失效的问题
            stmt = stmt.where(CaptureJobModel.status == CaptureJobStatus(status).value)

        with self.db_manager().sync_session() as session:
            models = session.execute(stmt).scalars().all()
            return [to_capture_job_entity(model) for model in models]

    def get_active(self) -> list[CaptureJobEntity]:
        active_values = [item.value for item in CaptureJobStatus.active_statuses()]
        stmt = select(CaptureJobModel).where(CaptureJobModel.status.in_(active_values))
        with self.db_manager().sync_session() as session:
            models = session.execute(stmt).scalars().all()
            return [to_capture_job_entity(model) for model in models]

    def search(
        self,
        page: int = 1,
        limit: int = 10,
        sort: str | None = None,
        status: CaptureJobStatus | None = None,
    ) -> tuple[list[CaptureJobEntity], int]:
        page = max(page, 1)
        limit = max(limit, 1)
        offset = (page - 1) * limit

        conditions = []
        if status is not None:
            conditions.append(CaptureJobModel.status == CaptureJobStatus(status).value)

        count_stmt = select(func.count(CaptureJobModel.id))
        stmt = select(CaptureJobModel)
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
            stmt = stmt.where(and_(*conditions))

        if sort:
            stmt = DatabaseUtils(CaptureJobModel).apply_order_by(stmt, sort)
        else:
            stmt = stmt.order_by(CaptureJobModel.created_at.desc())

        stmt = stmt.offset(offset).limit(limit)

        with self.db_manager().sync_session() as session:
            total_count = session.execute(count_stmt).scalar() or 0
            models = session.execute(stmt).scalars().all()
            return [to_capture_job_entity(model) for model in models], total_count
