from sqlalchemy import String, DateTime, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from datetime import datetime, timezone

from .base import Base


class Danmaku(Base):
    """
    Danmaku model representing bullet comments from Douyu live streams
    """

    __tablename__ = "danmakus"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    user_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    content: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fan_medal_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fan_medal_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    user_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    room_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Define indexes
    __table_args__ = (
        Index("danmakus_id_idx", "id"),
        Index("danmakus_user_id_idx", "user_id", "user_name"),
        Index("danmakus_created_at_idx", "created_at"),
        Index("danmakus_room_id_idx", "room_id"),
    )

    def __repr__(self):
        return f"<Danmaku(id='{self.id}', user_name='{self.user_name}', content='{self.content}')>"


class Room(Base):
    """
    Room model representing Douyu live stream rooms
    """

    __tablename__ = "rooms"

    room_id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=True)
    room_name: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self):
        return f"<Room(room_id='{self.room_id}', room_name='{self.room_name}')>"


class DanmakuAnalysis(Base):
    """
    Table for storing precomputed word frequency data
    """

    __tablename__ = "danmaku_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # 'word_freq' or 'wordcloud'
    frequencies: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )  # JSON string for word frequency
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("danmaku_analyses_id_idx", "id"),
        Index("danmaku_analyses_room_id_idx", "room_id"),
    )

    def __repr__(self):
        return f"<WordFrequency(id={self.id}, room_id={self.room_id}, start_time={self.start_time}, end_time={self.end_time}, cache_type={self.type})>"


class CaptureJob(Base):
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
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("capture_jobs_id_idx", "id"),
        Index("capture_jobs_room_id_idx", "room_id"),
        Index("capture_jobs_status_idx", "status"),
    )

    def __repr__(self):
        return f"<CaptureJob(id='{self.id}, 'room_id='{self.room_id}', status='{self.status}', start_time='{self.start_time}', end_time='{self.end_time}')>"
