from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class RoomModel(Base):
    """
    Room model representing Douyu live stream rooms
    """

    __tablename__ = "rooms"

    room_id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=True)
    room_name: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )

    def __repr__(self):
        return f"<RoomModel(room_id='{self.room_id}', room_name='{self.room_name}')>"
