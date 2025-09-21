from datetime import datetime
from typing import Any

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base_class import Base


class GameAudit(Base):
    __tablename__ = "game_audit"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(512), unique=True)
    url: Mapped[str] = mapped_column(String(512), unique=True)
    publish_date: Mapped[datetime] = mapped_column(DateTime)

    def __gt__(self, other: "GameAudit"):
        return self.publish_date > other.publish_date

    def __lt__(self, other: "GameAudit"):
        return self.publish_date < other.publish_date

    def __init__(self, title: str, url: str, publish_date: datetime, **kw: Any):
        super().__init__(**kw)
        self.title = title
        self.url = url
        self.publish_date = publish_date
