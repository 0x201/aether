import datetime
from typing import Any

from sqlalchemy import Column, Integer, String, DateTime

from src.db.base_class import Base


class EGameAudit(Base):
    __tablename__ = 'egame_audit'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256))
    publisher = Column(String(512), index=True)
    audit_no = Column(String(128), index=True)
    publish_date = Column(DateTime)

    def __init__(self, name: str, publisher: str, audit_no: str, publish_date: datetime, **kw: Any):
        super().__init__(**kw)
        self.name = name
        self.publisher = publisher
        self.audit_no = audit_no
        self.publish_date = publish_date
