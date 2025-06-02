from pydantic import BaseModel


class GameAlterationAuditBase(BaseModel):
    name: str
    audit_category: str
    publisher: str
    operator: str
    cancel_msg: str
    audit_no: str
    approval_date: str


class GameAlterationAuditCreate(GameAlterationAuditBase):
    pass


class GameAlterationAuditUpdate(GameAlterationAuditBase):
    pass


class GameAlterationAuditInDBBase(GameAlterationAuditBase):
    id: int
    name: str
    audit_category: str
    publisher: str
    operator: str
    cancel_msg: str
    audit_no: str
    approval_date: str

    class Config:
        from_attributes = True


class GameAlterationAudit(GameAlterationAuditInDBBase):
    pass
