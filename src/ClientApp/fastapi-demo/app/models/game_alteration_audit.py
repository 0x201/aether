import datetime
from typing import Any

from sqlalchemy import Column, Integer, String, DateTime

from app.db.base_class import Base


class GameAlterationAudit(Base):
    __tablename__ = 'game_alteration_audit'
    id = Column(Integer, primary_key=True)
    name = Column(String(256))
    audit_category = Column(String(128))
    publisher = Column(String(512))
    operator = Column(String(512))
    alteration_msg = Column(String(2048))
    audit_no = Column(String(128))
    alter_date = Column(DateTime)

    def __init__(self, name: str, audit_category: str, publisher: str, operator: str, alteration_msg: str,
                 audit_no: str, alter_date: datetime, **kw: Any):
        super().__init__(**kw)
        self.name = name
        self.audit_category = audit_category
        self.publisher = publisher
        self.operator = operator
        self.alteration_msg = alteration_msg
        self.audit_no = audit_no
        self.alter_date = alter_date
