from datetime import datetime
from typing import Any

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base_class import Base


class GameRevocationAudit(Base):
    __tablename__ = "revocation_audit"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256))
    audit_category: Mapped[str] = mapped_column(String(128))
    publisher: Mapped[str] = mapped_column(String(512))
    operator: Mapped[str] = mapped_column(String(512))
    revocation_msg: Mapped[str] = mapped_column(String(2048))
    audit_no: Mapped[str] = mapped_column(String(128))
    isbn: Mapped[str] = mapped_column(String(128))
    approval_date: Mapped[datetime] = mapped_column(DateTime)

    def __init__(
        self,
        name: str,
        audit_category: str,
        publisher: str,
        operator: str,
        revocation_msg: str,
        audit_no: str,
        isbn: str,
        approval_date: datetime,
        **kw: Any
    ):
        super().__init__(**kw)
        self.name = name
        self.audit_category = audit_category
        self.publisher = publisher
        self.operator = operator
        self.revocation_msg = revocation_msg
        self.audit_no = audit_no
        self.isbn = isbn
        self.approval_date = approval_date
