from datetime import UTC, datetime

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class CaptureJobModel(Base):
    """
    Table for storing capture jobs
    """

    __tablename__ = "capture_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )

    __table_args__ = (
        Index("capture_jobs_id_idx", "id"),
        Index("capture_jobs_room_id_idx", "room_id"),
        Index("capture_jobs_status_idx", "status"),
    )

    def __repr__(self):
        return (
            f"<CaptureJobModel(id='{self.id}, "
            f"'room_id='{self.room_id}', "
            f"status='{self.status}', "
            f"start_time='{self.start_time}', "
            f"end_time='{self.end_time}')>"
        )
