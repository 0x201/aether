from pydantic import BaseModel


class NetworkGameAuditBase(BaseModel):
    name: str
    audit_category: str
    publisher: str
    operator: str
    audit_no: str
    isbn: str
    category: str
    publish_date: str


class NetworkGameAuditCreate(NetworkGameAuditBase):
    pass


class NetworkGameAuditUpdate(NetworkGameAuditBase):
    pass


class NetworkGameAuditInDBBase(NetworkGameAuditBase):
    id: int
    name: str
    audit_category: str
    publisher: str
    operator: str
    audit_no: str
    isbn: str
    category: str
    publish_date: str

    class Config:
        from_attributes = True


class NetworkGameAudit(NetworkGameAuditInDBBase):
    pass


class NetworkGameRankBase(BaseModel):
    title: str
    legend: str
    audit_counts: list[int]
    chart_type: str = 'bar'


class NetworkGameCategoryRank(NetworkGameRankBase):
    audit_categories: list[str]


class NetworkGamePublisherRank(NetworkGameRankBase):
    publishers: list[str]


class NetworkGamePerYearRank(NetworkGameRankBase):
    years: list[str]
    total_audits: list[int]
    domestic_audits: list[int]
    foreign_audits: list[int]
