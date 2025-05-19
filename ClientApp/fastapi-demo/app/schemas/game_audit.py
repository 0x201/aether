import datetime

from pydantic import BaseModel


class GameAuditBase(BaseModel):
    title: str
    url: str
    publish_date: str


class GameAuditCreate(GameAuditBase):
    pass


class GameAuditUpdate(GameAuditBase):
    pass


class GameAuditInDBBase(GameAuditBase):
    id: int
    title: str
    url: str
    publish_date: datetime.datetime

    class Config:
        from_attributes = True


class GameAudit(GameAuditInDBBase):
    pass
