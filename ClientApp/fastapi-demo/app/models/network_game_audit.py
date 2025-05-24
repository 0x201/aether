import datetime
from typing import Any

from sqlalchemy import Column, Integer, String, DateTime

from app.db.base_class import Base


class NetworkGameAudit(Base):
    __tablename__ = 'network_game_audit'
    id = Column(Integer, primary_key=True)
    name = Column(String(256))
    audit_category = Column(String(128))
    publisher = Column(String(512))
    operator = Column(String(512))
    audit_no = Column(String(128))
    isbn = Column(String(128))
    category = Column(Integer)  # 1 国产 2 进口
    publish_date = Column(DateTime)

    def __init__(self, name: str, audit_category: str, publisher: str, operator: str, audit_no: str, isbn: str,
                 category: int, publish_date: datetime, **kw: Any):
        super().__init__(**kw)
        self.name = name
        self.audit_category = audit_category
        self.publisher = publisher
        self.operator = operator
        self.audit_no = audit_no
        self.isbn = isbn
        self.category = category
        self.publish_date = publish_date
