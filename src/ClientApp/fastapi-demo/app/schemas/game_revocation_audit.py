from pydantic import BaseModel


class GameRevocationAuditBase(BaseModel):
    name: str
    audit_category: str
    publisher: str
    operator: str
    revocation_msg: str
    audit_no: str
    isbn: str
    approve_date: str


class GameRevocationAuditCreate(GameRevocationAuditBase):
    pass


class GameRevocationAuditUpdate(GameRevocationAuditBase):
    pass


class GameRevocationAuditInDBBase(GameRevocationAuditBase):
    id: int
    name: str
    audit_category: str
    publisher: str
    operator: str
    revocation_msg: str
    audit_no: str
    isbn: str
    approve_date: str

    class Config:
        from_attributes = True


class GameRevocationAudit(GameRevocationAuditInDBBase):
    pass
