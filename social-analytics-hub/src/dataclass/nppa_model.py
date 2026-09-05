from datetime import datetime

from pydantic import BaseModel


class GameAuditBase(BaseModel):
    id: int
    name: str
    publisher: str
    auditNo: str
    publishDate: datetime


class EGameAuditDto(GameAuditBase):
    pass


class GameAlterationAuditDto(GameAuditBase):
    auditCategory: str
    operator: str
    alterationMsg: str
    alterDate: datetime


class GameAuditDto(BaseModel):
    id: int
    title: str
    url: str
    publishDate: datetime


class GameRevocationAuditDto(GameAuditBase):
    auditCategory: str
    operator: str
    revocationMsg: str
    auditNo: str
    isbn: str
    approvalDate: datetime


class NetworkGameAuditDto(GameAuditBase):
    auditCategory: str
    operator: str
    isbn: str
    category: str
