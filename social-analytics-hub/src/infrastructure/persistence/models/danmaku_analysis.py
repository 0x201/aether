from datetime import UTC, datetime

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class DanmakuAnalysisModel(Base):
    """
    Table for storing precomputed word frequency data
    """

    __tablename__ = "danmaku_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    frequencies: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )

    __table_args__ = (
        Index("danmaku_analyses_id_idx", "id"),
        Index("danmaku_analyses_room_id_idx", "room_id"),
    )

    def __repr__(self):
        return (
            f"<DanmakuAnalysisModel(id={self.id}, "
            f"room_id={self.room_id}, "
            f"start_time={self.start_time}, "
            f"end_time={self.end_time}, "
            f"cache_type={self.type})>"
        )
