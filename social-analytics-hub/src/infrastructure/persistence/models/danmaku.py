from datetime import UTC, datetime

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class DanmakuModel(Base):
    """
    Danmaku model representing bullet comments from Douyu live streams
    """

    __tablename__ = "danmakus"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    user_name: Mapped[str | None] = mapped_column(String, nullable=True)
    content: Mapped[str | None] = mapped_column(String, nullable=True)
    fan_medal_name: Mapped[str | None] = mapped_column(String, nullable=True)
    fan_medal_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_level: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    room_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
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
        return (
            f"<DanmakuModel(id='{self.id}', "
            f"user_name='{self.user_name}', "
            f"content='{self.content}')>"
        )
