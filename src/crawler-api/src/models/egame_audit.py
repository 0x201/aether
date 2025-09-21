import datetime
from typing import Any
from datetime import datetime

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base_class import Base


class EGameAudit(Base):
    __tablename__ = "egame_audit"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    publisher: Mapped[str] = mapped_column(String(512), index=True)
    audit_no: Mapped[str] = mapped_column(String(128), index=True)
    publish_date: Mapped[datetime] = mapped_column(DateTime)

    def __init__(
        self,
        name: str,
        publisher: str,
        audit_no: str,
        publish_date: datetime,
        **kw: Any
    ):
        super().__init__(**kw)
        self.name = name
        self.publisher = publisher
        self.audit_no = audit_no
        self.publish_date = publish_date
