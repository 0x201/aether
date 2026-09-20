from datetime import datetime, timedelta, timezone

from loguru import logger
from sqlalchemy import func, select, update

from shared.database_utils import DatabaseUtils
from src.domain.danmaku.entities import CaptureJobEntity
from src.domain.danmaku.repositories import CaptureJobRepository
from src.infrastructure.database.manager import PsycopgDbSessionManager
from src.infrastructure.persistence.models.capture_job import CaptureJobModel


class PostgresCaptureJobRepository(CaptureJobRepository):
    def __init__(self, db_manager: PsycopgDbSessionManager):
        self.db_manager = db_manager

    # =================================================
    # Commands
    # =================================================
    def add(self, entity: CaptureJobEntity) -> CaptureJobEntity:
        """
        Create a new capture job record in the database

        Args:
            entity: Entity to save

        Returns:
            CaptureJobEntity: The created capture job record
        """
        with self.db_manager.sync_uow() as session:
            model = CaptureJobModel(
                room_id=entity.room_id,
                status=entity.status,
                duration=entity.duration,
                start_time=datetime.now(timezone(timedelta(hours=8))),
                end_time=None,
            )

            session.add(model)
            session.commit()
            session.refresh(model)

            entity.id = model.id
            logger.info(
                f"Created capture job for room {entity.room_id}, ID: {model.id}"
            )

            return entity

    def update_status(
        self, job_id: int, status: str, end_time: datetime | None = None
    ) -> bool:
        """
        Update the status of a capture job

        Args:
            job_id: ID of the job to update
            status: New status for the job
            end_time: End time if applicable

        Returns:
            bool: True if updated successfully, False otherwise
        """
        with self.db_manager.sync_uow() as session:
            stmt = (
                update(CaptureJobModel)
                .where(CaptureJobModel.id == job_id)
                .values(status=status, end_time=end_time)
                .returning(CaptureJobModel.id)
            )
            result = session.execute(stmt)

            updated_rows = result.fetchall()

            session.commit()

            if len(updated_rows) > 0:
                logger.info(f"Updated capture job {job_id} status to {status}")
                return True
            else:
                logger.warning(f"No capture job found with ID {job_id} to update")
                return False

    # =================================================
    # Queries
    # =================================================
    def get_by_room_id(
        self, room_id: int, status: str | None
    ) -> CaptureJobEntity | None:
        """
        Get a capture job for a specific room

        Args:
            room_id: Room ID to search for
            status: Fiter status if applicable

        Returns:
            CaptureJobEntity if found, None otherwise
        """
        with self.db_manager.sync_session() as session:
            stmt = select(CaptureJobModel).where(CaptureJobModel.room_id == room_id)

            if status:
                stmt = stmt.where(CaptureJobModel.status == status)

            model = session.execute(stmt).scalar_one_or_none()

            return (
                CaptureJobEntity(
                    id=model.id,
                    room_id=model.room_id,
                    status=model.status,
                    duration=model.duration,
                    start_time=model.start_time,
                    end_time=model.end_time,
                    created_at=model.created_at,
                )
                if model
                else None
            )

    def get_list(self, status: str | None) -> list[CaptureJobEntity]:
        """
        Get all capture jobs

        Returns:
            List[CaptureJob]: List of active capture jobs
        """
        with self.db_manager.sync_session() as session:
            stmt = select(CaptureJobModel)

            if status:
                stmt.where(CaptureJobModel.status == status)

            models = session.execute(stmt).scalars().all()
            return [
                CaptureJobEntity(
                    id=model.id,
                    room_id=model.room_id,
                    status=model.status,
                    duration=model.duration,
                    start_time=model.start_time,
                    end_time=model.end_time,
                    created_at=model.created_at,
                )
                for model in models
            ]

    def search(
        self, page: int, limit: int, sort: str | None = None
    ) -> tuple[list[CaptureJobEntity], int]:
        """
        Get capture jobs with pagination

        Args:
            page: Page number (starting from 1)
            limit: Number of items per page

        Returns:
            Tuple[List[CaptureJob], int]:
            A tuple containing the list of jobs for the current page and the total count
        """
        with self.db_manager.sync_session() as session:
            offset = (page - 1) * limit
            total_count = session.execute(
                select(func.count(CaptureJobModel.id))
            ).scalar()

            stmt = select(CaptureJobModel)

            if sort:
                db_utils = DatabaseUtils(CaptureJobModel)
                stmt = db_utils.apply_order_by(stmt, sort)

            stmt = stmt.offset(offset).limit(limit)
            models = session.execute(stmt).scalars().all()

            return [
                CaptureJobEntity(
                    id=model.id,
                    room_id=model.room_id,
                    status=model.status,
                    duration=model.duration,
                    start_time=model.start_time,
                    end_time=model.end_time,
                    created_at=model.created_at,
                )
                for model in models
            ], (total_count or 0)
