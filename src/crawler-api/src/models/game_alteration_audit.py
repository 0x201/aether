from datetime import datetime
from typing import Any

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base_class import Base


class GameAlterationAudit(Base):
    __tablename__ = "game_alteration_audit"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256))
    audit_category: Mapped[str] = mapped_column(String(128))
    publisher: Mapped[str] = mapped_column(String(512))
    operator: Mapped[str] = mapped_column(String(512))
    alteration_msg: Mapped[str] = mapped_column(String(2048))
    audit_no: Mapped[str] = mapped_column(String(128))
    alter_date: Mapped[datetime] = mapped_column(DateTime)

    def __init__(
        self,
        name: str,
        audit_category: str,
        publisher: str,
        operator: str,
        alteration_msg: str,
        audit_no: str,
        alter_date: datetime,
        **kw: Any
    ):
        super().__init__(**kw)
        self.name = name
        self.audit_category = audit_category
        self.publisher = publisher
        self.operator = operator
        self.alteration_msg = alteration_msg
        self.audit_no = audit_no
        self.alter_date = alter_date
