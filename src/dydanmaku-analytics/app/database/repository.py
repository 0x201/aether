from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from app.dataclass.model import CaptureJobStatus
from app.common import DatabaseUtils
from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .models import CaptureJob, Danmaku, Room

from loguru import logger


class DanmakuRepository:
    """
    Repository class for Danmaku entity with full CRUD operations
    """

    def __init__(self, session: Session):
        self.session = session

    def insert_danmaku(
        self,
        user_id: str,
        user_name: str,
        content: str,
        fan_medal_name: Optional[str] = None,
        fan_medal_level: Optional[int] = None,
        user_level: Optional[int] = None,
        room_id: Optional[int] = None,
    ) -> bool:
        """
        Insert a new danmaku into the database

        Returns:
            bool: True if inserted successfully, False if duplicate
        """
        try:
            danmaku = Danmaku(
                user_id=user_id,
                user_name=user_name,
                content=content,
                fan_medal_name=fan_medal_name,
                fan_medal_level=fan_medal_level,
                user_level=user_level,
                room_id=room_id,
            )

            self.session.add(danmaku)
            self.session.commit()
            self.session.refresh(danmaku)
            return True
        except SQLAlchemyError as e:
            logger.error(f"Database error inserting danmaku: {e}")
            self.session.rollback()
            return False

    def get_or_create_room(self, room_id: int, room_name: str) -> Room:
        """
        Get room from database or create it if it doesn't exist

        Args:
            room_id: Unique identifier for the room
            room_name: Name of the room

        Returns:
            Room: Room object from database
        """
        try:
            # Try to get existing room
            logger.info(f"Getting room: {room_name}")
            stmt = select(Room).where(Room.room_id == room_id)
            result = self.session.execute(stmt)
            room = result.scalar_one_or_none()

            # If room doesn't exist, create it
            if room is None:
                room = Room(
                    room_id=room_id,
                    room_name=room_name,
                )
                self.session.add(room)
                self.session.commit()
                self.session.refresh(room)
                logger.info(f"Created new room: {room_id} - {room_name}")
            else:
                # Update existing room info
                room.room_name = room_name
                self.session.commit()
                self.session.refresh(room)
                logger.info(f"Updated existing room: {room_id} - {room_name}")

            return room
        except SQLAlchemyError as e:
            logger.error(f"Database error getting/creating room: {e}")
            self.session.rollback()
            raise

    def insert_danmaku_batch(self, danmu_list: List[Danmaku]) -> int:
        """
        Insert a batch of danmaku into the database

        Args:
            danmu_list: List of tuples containing danmaku data in the order:
                        (user_id, user_name, content, fan_medal_name, fan_medal_level, user_level, room_id)

        Returns:
            int: Number of rows inserted
        """
        if not danmu_list:
            return 0

        try:
            inserted_count = len(danmu_list)
            self.session.add_all(danmu_list)
            self.session.commit()
            return inserted_count
        except SQLAlchemyError as e:
            logger.error(f"Database error during batch insert: {e}")
            self.session.rollback()
            return 0

    def get_danmaku_count(self) -> int:
        """Get total number of danmaku in database"""
        try:
            stmt = select(func.count()).select_from(Danmaku)
            count = self.session.execute(stmt).scalar()
            return count if count is not None else 0
        except SQLAlchemyError as e:
            logger.error(f"Database error getting danmaku count: {e}")
            return 0

    def get_recent_danmaku(self, limit: int = 10) -> List[Danmaku]:
        """Get most recent danmaku entries"""
        try:
            stmt = select(Danmaku).order_by(Danmaku.created_at.desc()).limit(limit)
            result = self.session.execute(stmt).scalars().all()
            return list(result)
        except SQLAlchemyError as e:
            logger.error(f"Database error getting recent danmaku: {e}")
            return []

    def get_danmaku_by_user(self, user_name: str) -> List[Danmaku]:
        """Get all danmaku by a specific user"""
        try:
            stmt = (
                select(Danmaku)
                .where(Danmaku.user_name == user_name)
                .order_by(Danmaku.created_at.desc())
            )
            result = self.session.execute(stmt).scalars().all()
            return list(result)
        except SQLAlchemyError as e:
            logger.error(f"Database error getting danmaku by user: {e}")
            return []

    def get_danmaku_by_room(self, room_id: int, limit: int = 100) -> List[Danmaku]:
        """Get recent danmaku for a specific room with limit"""
        try:
            stmt = (
                select(Danmaku)
                .where(Danmaku.room_id == room_id)
                .order_by(Danmaku.created_at.desc())
                .limit(limit)
            )
            result = self.session.execute(stmt).scalars().all()
            return list(result)
        except SQLAlchemyError as e:
            logger.error(f"Database error getting danmaku by room: {e}")
            return []

    def update_danmaku(
        self,
        id: str,
        user_name: Optional[str] = None,
        content: Optional[str] = None,
        fan_medal_name: Optional[str] = None,
        fan_medal_level: Optional[int] = None,
        user_level: Optional[int] = None,
    ) -> bool:
        """
        Update an existing danmaku in the database

        Returns:
            bool: True if updated successfully, False otherwise
        """
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
            result = self.session.execute(stmt)
            self.session.commit()

            # If we got any rows back, the update was successful
            updated_rows = result.fetchall()
            return len(updated_rows) > 0
        except SQLAlchemyError as e:
            logger.error(f"Database error updating danmaku: {e}")
            self.session.rollback()
            return False

    def delete_danmaku(self, id: str) -> bool:
        """
        Delete a danmaku from the database

        Returns:
            bool: True if deleted successfully, False otherwise
        """
        try:
            # First check if the record exists before attempting deletion
            existing = self.session.execute(
                select(Danmaku).where(Danmaku.id == id)
            ).first()
            if not existing:
                return False

            # Delete the danmaku
            stmt = delete(Danmaku).where(Danmaku.id == id)
            _ = self.session.execute(stmt)

            self.session.commit()

            # Since we checked existence first, and assuming no concurrent modifications,
            # we can safely return True if commit was successful
            return True
        except SQLAlchemyError as e:
            logger.error(f"Database error deleting danmaku: {e}")
            self.session.rollback()
            return False

    def get_danmaku_by_id(self, id: str) -> Optional[Danmaku]:
        """
        Get a specific danmaku by its id

        Returns:
            Danmu: Danmu object if found, None otherwise
        """
        try:
            stmt = select(Danmaku).where(Danmaku.id == id)
            result = self.session.execute(stmt).scalars().first()
            return result
        except SQLAlchemyError as e:
            logger.error(f"Database error getting danmaku by id: {e}")
            return None

    def get_all_danmaku(
        self, limit: int = 100, offset: int = 0, sort: Optional[str] = None
    ) -> List[Tuple[Danmaku, str]]:
        """
        Get all danmaku with pagination and room names

        Returns:
            List[Tuple[Danmu, str]]: List of tuples containing (danmaku, room_name)
        """
        try:
            # Base query - always join with Room to get room_name
            stmt = select(Danmaku, Room.room_name).join(
                Room, Danmaku.room_id == Room.room_id, isouter=True
            )
            db_utils = DatabaseUtils(Danmaku)
            stmt = db_utils.apply_order_by(stmt, sort).limit(limit).offset(offset)

            result = self.session.execute(stmt).all()
            # Convert Row objects to tuples to match the return type
            return [(row[0], row[1]) for row in result]
        except SQLAlchemyError as e:
            logger.error(f"Database error getting all danmaku: {e}")
            return []

    def search_danmaku(
        self,
        user_name: Optional[str] = None,
        content: Optional[str] = None,
        room_id: Optional[int] = None,
        user_level_min: Optional[int] = None,
        user_level_max: Optional[int] = None,
        fan_medal_level_min: Optional[int] = None,
        fan_medal_level_max: Optional[int] = None,
        fan_medal_name: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
        sort: Optional[str] = None,
    ) -> List[Tuple[Danmaku, str]]:
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
                conditions.append(Danmaku.fan_medal_name.like(f"%{fan_medal_name}%"))

            if conditions:
                stmt = stmt.where(and_(*conditions))

            db_utils = DatabaseUtils(Danmaku)
            stmt = db_utils.apply_order_by(stmt, sort)
                
            stmt = stmt.limit(limit).offset(offset)

            result = self.session.execute(stmt).all()
            # Convert Row objects to tuples to match the return type
            return [(row[0], row[1]) for row in result]
        except SQLAlchemyError as e:
            logger.error(f"Database error searching danmaku: {e}")
            return []

    def get_search_count(
        self,
        user_name: Optional[str] = None,
        content: Optional[str] = None,
        room_id: Optional[int] = None,
        user_level_min: Optional[int] = None,
        user_level_max: Optional[int] = None,
        fan_medal_level_min: Optional[int] = None,
        fan_medal_level_max: Optional[int] = None,
        fan_medal_name: Optional[str] = None,
    ) -> int:
        """
        Get count of danmaku matching search criteria

        Returns:
            int: Count of matching danmaku
        """
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
                conditions.append(Danmaku.fan_medal_name.like(f"%{fan_medal_name}%"))

            if conditions:
                stmt = stmt.where(and_(*conditions))

            count = self.session.execute(stmt).scalar()
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
        try:
            job = CaptureJob(
                room_id=room_id,
                url=url,
                status=CaptureJobStatus.RUNNING.value,
                duration=duration,
                start_time=datetime.now(timezone(timedelta(hours=8))),
                end_time=None,  # Will be set when the job ends
            )

            self.session.add(job)
            self.session.commit()
            self.session.refresh(job)

            logger.info(f"Created capture job for room {room_id}, ID: {job.id}")
            return job
        except SQLAlchemyError as e:
            logger.error(f"Database error creating capture job: {e}")
            self.session.rollback()
            raise

    def update_capture_job_status(
        self, job_id: int, status: str, end_time: Optional[datetime] = None
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
        try:
            stmt = (
                update(CaptureJob)
                .where(CaptureJob.id == job_id)
                .values(status=status, end_time=end_time)
                .returning(CaptureJob.id)
            )
            result = self.session.execute(stmt)

            updated_rows = result.fetchall()

            self.session.commit()

            if len(updated_rows) > 0:
                logger.info(f"Updated capture job {job_id} status to {status}")
                return True
            else:
                logger.warning(f"No capture job found with ID {job_id} to update")
                return False
        except SQLAlchemyError as e:
            logger.error(f"Database error updating capture job status: {e}")
            self.session.rollback()
            return False

    def get_running_capture_job(self, room_id: int) -> Optional[CaptureJob]:
        """
        Get a running capture job by its room ID

        Args:
            room_id: Room ID of the job to retrieve

        Returns:
            Optional[CaptureJob]: The capture job record, or None if not found
        """
        try:
            stmt = select(CaptureJob).where(
                and_(
                    CaptureJob.room_id == room_id,
                    CaptureJob.status == CaptureJobStatus.RUNNING.value,
                )
            )
            result = self.session.execute(stmt).scalar_one_or_none()
            return result
        except SQLAlchemyError as e:
            logger.error(f"Database error getting capture job: {e}")
            return None

    def get_active_capture_jobs(self) -> List[CaptureJob]:
        """
        Get all active (non-terminated) capture jobs

        Returns:
            List[CaptureJob]: List of active capture jobs
        """
        try:
            stmt = select(CaptureJob).where(
                CaptureJob.status == CaptureJobStatus.RUNNING.value
            )
            result = self.session.execute(stmt).scalars().all()
            return list(result)
        except SQLAlchemyError as e:
            logger.error(f"Database error getting active capture jobs: {e}")
            return []

    def terminate_all_capture_jobs(self) -> int:
        """
        Mark all running capture jobs as terminated

        Returns:
            int: Number of jobs that were updated
        """
        try:
            current_time = datetime.now(timezone(timedelta(hours=8)))

            stmt = (
                update(CaptureJob)
                .where(CaptureJob.status == CaptureJobStatus.RUNNING.value)
                .values(status=CaptureJobStatus.TERMINATED.value, end_time=current_time)
                .returning(CaptureJob.id)
            )
            result = self.session.execute(stmt)
            updated_count = len(result.fetchall())

            logger.info(f"Terminated {updated_count} active capture jobs")
            self.session.commit()
            return updated_count
        except SQLAlchemyError as e:
            logger.error(f"Database error terminating capture jobs: {e}")
            self.session.rollback()
            return 0

    def get_capture_jobs(self, page: int, limit: int, sort: Optional[str] = None) -> Tuple[List[CaptureJob], int]:
        """
        Get capture jobs with pagination

        Args:
            page: Page number (starting from 1)
            limit: Number of items per page

        Returns:
            Tuple[List[CaptureJob], int]: A tuple containing the list of jobs for the current page and the total count
        """
        try:
            # Calculate offset
            offset = (page - 1) * limit

            # Count total number of jobs
            total_count = self.session.execute(
                select(func.count(CaptureJob.id))
            ).scalar()

            # Get paginated jobs
            stmt = select(CaptureJob)
            
            if sort:
                db_utils = DatabaseUtils(CaptureJob)
                stmt = db_utils.apply_order_by(stmt, sort)

            stmt = stmt.offset(offset).limit(limit)
            result = self.session.execute(stmt).scalars().all()

            return list(result), (total_count or 0)
        except SQLAlchemyError as e:
            logger.error(f"Database error getting capture jobs with pagination: {e}")
            return [], 0
