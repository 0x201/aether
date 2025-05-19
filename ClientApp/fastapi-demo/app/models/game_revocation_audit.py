import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.db.base_class import Base


class GameRevocationAudit(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256))
    audit_category = Column(String(128))
    publisher = Column(String(512))
    operator = Column(String(512))
    revocation_msg = Column(String(2048))
    audit_no = Column(String(128))
    isbn = Column(String(128))
    approval_date = Column(DateTime)
    audit_id = Column(Integer, ForeignKey("game_audit.id"))

    def __init__(self, name: str, audit_category: str, publisher: str, operator: str
                 , revocation_msg: str, audit_no: str, isbn: str, approval_date: datetime):
        self.name = name
        self.audit_category = audit_category
        self.publisher = publisher
        self.operator = operator
        self.revocation_msg = revocation_msg
        self.audit_no = audit_no
        self.isbn = isbn
        self.approval_date = approval_date
