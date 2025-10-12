from datetime import datetime
from typing import Any

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base_class import Base


class NetworkGameAudit(Base):
    __tablename__ = "network_game_audit"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    audit_category: Mapped[str] = mapped_column(String(128))
    publisher: Mapped[str] = mapped_column(String(512))
    operator: Mapped[str] = mapped_column(String(512))
    audit_no: Mapped[str] = mapped_column(String(128))
    isbn: Mapped[str] = mapped_column(String(128))
    category: Mapped[str] = mapped_column(Integer)  # 1 国产 2 进口
    publish_date: Mapped[datetime] = mapped_column(DateTime)

    def __init__(
        self,
        name: str,
        audit_category: str,
        publisher: str,
        operator: str,
        audit_no: str,
        isbn: str,
        category: int,
        publish_date: datetime,
        **kw: Any
    ):
        super().__init__(**kw)
        self.name = name
        self.audit_category = audit_category
        self.publisher = publisher
        self.operator = operator
        self.audit_no = audit_no
        self.isbn = isbn
        self.category = category
        self.publish_date = publish_date
