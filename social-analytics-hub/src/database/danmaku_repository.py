from datetime import datetime, timedelta, timezone

from loguru import logger
from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.exc import SQLAlchemyError

from src.schemas import CaptureJobStatus
from src.shared import DatabaseUtils

from .danmaku_models import CaptureJob, Danmaku, Room
from .session_factory import SessionFactory


class DanmakuRepository:
    """
    Repository class for Danmaku entity with full CRUD operations
    """

    def __init__(self, session_factory: SessionFactory):
        self.session_factory: SessionFactory = session_factory

    def insert_danmaku(
        self,
        user_id: str,
        user_name: str,
        content: str,
        fan_medal_name: str | None = None,
        fan_medal_level: int | None = None,
        user_level: int | None = None,
        room_id: int | None = None,
    ) -> bool:
        """
        Insert a new danmaku into the database

        Returns:
            bool: True if inserted successfully, False if duplicate
        """

        with self.session_factory.transaction() as transaction:
            danmaku = Danmaku(
                user_id=user_id,
                user_name=user_name,
                content=content,
                fan_medal_name=fan_medal_name,
                fan_medal_level=fan_medal_level,
                user_level=user_level,
                room_id=room_id,
            )
            transaction.add(danmaku)
            return True

    def insert_danmaku_batch(self, danmaku_list: list[Danmaku]) -> int:
        """
        Insert a batch of danmaku into the database

        Args:
            danmaku_list: List of tuples containing danmaku data in the order:
                        (user_id, user_name, content, fan_medal_name, fan_medal_level, user_level, room_id)

        Returns:
            int: Number of rows inserted
        """
        if not danmaku_list:
            return 0
        with self.session_factory.transaction() as transaction:
            inserted_count = len(danmaku_list)
            transaction.add_all(danmaku_list)
            return inserted_count

    def get_danmaku_count(self) -> int:
        """Get total number of danmaku in database"""
        with self.session_factory.query() as session:
            try:
                stmt = select(func.count()).select_from(Danmaku)
                count = session.execute(stmt).scalar()
                return count if count is not None else 0
            except Exception as e:
                logger.error(f"Database error getting danmaku count: {e}")
                return 0

    def get_recent_danmaku(self, limit: int = 10) -> list[Danmaku]:
        """Get most recent danmaku entries"""
        with self.session_factory.query() as session:
            try:
                stmt = select(Danmaku).order_by(Danmaku.created_at.desc()).limit(limit)
                result = session.execute(stmt).scalars().all()
                return list(result)
            except Exception as e:
                logger.error(f"Database error getting recent danmaku: {e}")
                return []

    def get_danmaku_by_user(self, user_name: str) -> list[Danmaku]:
        """Get all danmaku by a specific user"""
        with self.session_factory.query() as session:
            try:
                stmt = (
                    select(Danmaku)
                    .where(Danmaku.user_name == user_name)
                    .order_by(Danmaku.created_at.desc())
                )
                result = session.execute(stmt).scalars().all()
                return list(result)
            except SQLAlchemyError as e:
                logger.error(f"Database error getting danmaku by user: {e}")
                return []

    def get_danmaku_by_room(self, room_id: int, limit: int = 100) -> list[Danmaku]:
        """Get recent danmaku for a specific room with limit"""
        with self.session_factory.query() as session:
            try:
                stmt = (
                    select(Danmaku)
                    .where(Danmaku.room_id == room_id)
                    .order_by(Danmaku.created_at.desc())
                    .limit(limit)
                )
                result = session.execute(stmt).scalars().all()
                return list(result)
            except SQLAlchemyError as e:
                logger.error(f"Database error getting danmaku by room: {e}")
                return []

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

        with self.session_factory.transaction(autocommit=False) as transaction:
            try:
                # Build dynamic update query based on provided fields
                values = {}
                if user_name is not None:
                    values[Danmaku.user_name] = user_name
                if content is not None:
                    values[Danmaku.content] = content
                if fan_medal_name is not None:
                    values[Danmaku.fan_medal_name] = fan_medal_name
                if fan_medal_level is not None:
                    values[Danmaku.fan_medal_level] = fan_medal_level
                if user_level is not None:
                    values[Danmaku.user_level] = user_level

                # Only proceed if there are fields to update
                if not values:
                    return False

                # Using RETURNING clause to check if any rows were affected
                stmt = (
                    update(Danmaku)
                    .where(Danmaku.id == id)
                    .values(**values)
                    .returning(Danmaku.id)
                )
                result = transaction.execute(stmt)
                transaction.commit()

                # If we got any rows back, the update was successful
                updated_rows = result.fetchall()
                return len(updated_rows) > 0
            except SQLAlchemyError as e:
                logger.error(f"Database error updating danmaku: {e}")
                transaction.rollback()
                return False

    def delete_danmaku(self, id: str) -> bool:
        """
        Delete a danmaku from the database

        Parameters:
            id (str): ID of the danmaku to delete

        Returns:
            bool: True if deleted successfully, False otherwise
        """
        with self.session_factory.transaction() as transaction:
            # First check if the record exists before attempting deletion
            existing = transaction.execute(
                select(Danmaku).where(Danmaku.id == id)
            ).first()
            if not existing:
                return False

            # Delete the danmaku
            stmt = delete(Danmaku).where(Danmaku.id == id)
            _ = transaction.execute(stmt)
            return True

    def get_danmaku_by_id(self, id: str) -> Danmaku | None:
        """
        Get a specific danmaku by its id

        Returns:
            Danmaku: Danmaku object if found, None otherwise
        """
        with self.session_factory.query() as session:
            try:
                stmt = select(Danmaku).where(Danmaku.id == id)
                result = session.execute(stmt).scalars().first()
                return result
            except SQLAlchemyError as e:
                logger.error(f"Database error getting danmaku by id: {e}")
                return None

    def get_all_danmaku(
        self, limit: int = 100, offset: int = 0, sort: str | None = None
    ) -> list[tuple[Danmaku, str]]:
        """
        Get all danmaku with pagination and room names

        Returns:
            List[Tuple[Danmaku, str]]: List of tuples containing (danmaku, room_name)
        """
        with self.session_factory.query() as session:
            try:
                # Base query - always join with Room to get room_name
                stmt = select(Danmaku, Room.room_name).join(
                    Room, Danmaku.room_id == Room.room_id, isouter=True
                )
                db_utils = DatabaseUtils(Danmaku)
                stmt = db_utils.apply_order_by(stmt, sort).limit(limit).offset(offset)

                result = session.execute(stmt).all()
                # Convert Row objects to tuples to match the return type
                return [(row[0], row[1]) for row in result]
            except SQLAlchemyError as e:
                logger.error(f"Database error getting all danmaku: {e}")
                return []

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
    ) -> list[tuple[Danmaku, str]]:
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
            sort: Sort string in format "field_name direction" (e.g., "id desc", "created_at asc")

        Returns:
            List[Tuple[Danmaku, str]]: List of tuples containing (danmaku, room_name) matching the criteria
        """
        with self.session_factory.query() as session:
            try:
                # Base query - always join with Room to get room_name
                stmt = select(Danmaku, Room.room_name).join(
                    Room, Danmaku.room_id == Room.room_id, isouter=True
                )

                # Add filters
                conditions = []
                if user_name:
                    conditions.append(Danmaku.user_name.like(f"%{user_name}%"))
                if content:
                    conditions.append(Danmaku.content.like(f"%{content}%"))
                if room_id:
                    conditions.append(Danmaku.room_id == room_id)
                if user_level_min is not None:
                    conditions.append(Danmaku.user_level >= user_level_min)
                if user_level_max is not None:
                    conditions.append(Danmaku.user_level <= user_level_max)
                if fan_medal_level_min is not None:
                    conditions.append(Danmaku.fan_medal_level >= fan_medal_level_min)
                if fan_medal_level_max is not None:
                    conditions.append(Danmaku.fan_medal_level <= fan_medal_level_max)
                if fan_medal_name is not None:
                    conditions.append(
                        Danmaku.fan_medal_name.like(f"%{fan_medal_name}%")
                    )

                if conditions:
                    stmt = stmt.where(and_(*conditions))

                db_utils = DatabaseUtils(Danmaku)
                stmt = db_utils.apply_order_by(stmt, sort)

                stmt = stmt.limit(limit).offset(offset)

                result = session.execute(stmt).all()
                # Convert Row objects to tuples to match the return type
                return [(row[0], row[1]) for row in result]
            except SQLAlchemyError as e:
                logger.error(f"Database error searching danmaku: {e}")
                return []

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
        with self.session_factory.query() as session:
            try:
                # Base query
                stmt = select(func.count()).select_from(Danmaku)

                # Add filters
                conditions = []
                if user_name:
                    conditions.append(Danmaku.user_name.like(f"%{user_name}%"))
                if content:
                    conditions.append(Danmaku.content.like(f"%{content}%"))
                if room_id:
                    conditions.append(Danmaku.room_id == room_id)
                if user_level_min is not None:
                    conditions.append(Danmaku.user_level >= user_level_min)
                if user_level_max is not None:
                    conditions.append(Danmaku.user_level <= user_level_max)
                if fan_medal_level_min is not None:
                    conditions.append(Danmaku.fan_medal_level >= fan_medal_level_min)
                if fan_medal_level_max is not None:
                    conditions.append(Danmaku.fan_medal_level <= fan_medal_level_max)
                if fan_medal_name is not None:
                    conditions.append(
                        Danmaku.fan_medal_name.like(f"%{fan_medal_name}%")
                    )

                if conditions:
                    stmt = stmt.where(and_(*conditions))

                count = session.execute(stmt).scalar()
                return count if count is not None else 0
            except SQLAlchemyError as e:
                logger.error(f"Database error getting search count: {e}")
                return 0

    def create_capture_job(self, room_id: int, url: str, duration: int) -> CaptureJob:
        """
        Create a new capture job record in the database

        Args:
            room_id: ID of the room to capture from
            url: URL of the room
            duration: Duration of the capture in seconds

        Returns:
            CaptureJob: The created capture job record
        """
        with self.session_factory.transaction(autocommit=False) as transaction:
            try:
                job = CaptureJob(
                    room_id=room_id,
                    url=url,
                    status=CaptureJobStatus.RUNNING.value,
                    duration=duration,
                    start_time=datetime.now(timezone(timedelta(hours=8))),
                    end_time=None,  # Will be set when the job ends
                )

                transaction.add(job)
                transaction.commit()
                transaction.refresh(job)

                logger.info(f"Created capture job for room {room_id}, ID: {job.id}")
                return job
            except SQLAlchemyError as e:
                logger.error(f"Database error creating capture job: {e}")
                transaction.rollback()
                raise

    def update_capture_job_status(
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
        with self.session_factory.transaction(autocommit=False) as transaction:
            try:
                stmt = (
                    update(CaptureJob)
                    .where(CaptureJob.id == job_id)
                    .values(status=status, end_time=end_time)
                    .returning(CaptureJob.id)
                )
                result = transaction.execute(stmt)

                updated_rows = result.fetchall()

                transaction.commit()

                if len(updated_rows) > 0:
                    logger.info(f"Updated capture job {job_id} status to {status}")
                    return True
                else:
                    logger.warning(f"No capture job found with ID {job_id} to update")
                    return False
            except SQLAlchemyError as e:
                logger.error(f"Database error updating capture job status: {e}")
                transaction.rollback()
                return False

    def get_running_capture_job(self, room_id: int) -> CaptureJob | None:
        """
        Get a running capture job for a specific room

        Args:
            room_id: Room ID to search for

        Returns:
            CaptureJob if found, None otherwise
        """
        with self.session_factory.query() as session:
            try:
                stmt = select(CaptureJob).where(
                    and_(
                        CaptureJob.room_id == room_id,
                        CaptureJob.status == CaptureJobStatus.RUNNING.value,
                    )
                )
                result = session.execute(stmt).scalar_one_or_none()
                return result
            except Exception as e:
                logger.error(f"Database error getting capture job: {e}")
                return None

    def get_active_capture_jobs(self) -> list[CaptureJob]:
        """
        Get all active (non-terminated) capture jobs

        Returns:
            List[CaptureJob]: List of active capture jobs
        """
        with self.session_factory.query() as session:
            try:
                stmt = select(CaptureJob).where(
                    CaptureJob.status == CaptureJobStatus.RUNNING.value
                )
                result = session.execute(stmt).scalars().all()
                return list(result)
            except SQLAlchemyError as e:
                logger.error(f"Database error getting active capture jobs: {e}")
                return []

    def get_capture_jobs(
        self, page: int, limit: int, sort: str | None = None
    ) -> tuple[list[CaptureJob], int]:
        """
        Get capture jobs with pagination

        Args:
            page: Page number (starting from 1)
            limit: Number of items per page

        Returns:
            Tuple[List[CaptureJob], int]: A tuple containing the list of jobs for the current page and the total count
        """
        with self.session_factory.query() as session:
            try:
                # Calculate offset
                offset = (page - 1) * limit

                # Count total number of jobs
                total_count = session.execute(
                    select(func.count(CaptureJob.id))
                ).scalar()

                # Get paginated jobs
                stmt = select(CaptureJob)

                if sort:
                    db_utils = DatabaseUtils(CaptureJob)
                    stmt = db_utils.apply_order_by(stmt, sort)

                stmt = stmt.offset(offset).limit(limit)
                result = session.execute(stmt).scalars().all()

                return list(result), (total_count or 0)
            except SQLAlchemyError as e:
                logger.error(
                    f"Database error getting capture jobs with pagination: {e}"
                )
                return [], 0

    def get_danmaku_in_time_range(
        self, start_time: datetime, end_time: datetime, room_id: int | None = None
    ) -> list[Danmaku]:
        query = select(Danmaku).where(
            and_(
                Danmaku.room_id == room_id,
                Danmaku.created_at >= start_time,
                Danmaku.created_at <= end_time,
            )
        )
        if room_id:
            query = query.where(Danmaku.room_id == room_id)
        with self.session_factory.query() as session:
            result = list(session.execute(query).scalars().all())
        return result
