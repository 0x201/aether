from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import DeclarativeBase, declared_attr, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Auditable(DeclarativeBase):
    @declared_attr
    def created_time(cls) -> Mapped[str]:
        return mapped_column(DateTime, name="CreatedTime", nullable=False)

    @declared_attr
    def created_by(cls) -> Mapped[str]:
        return mapped_column(String(200), name="CreatedBy", default="", nullable=False)

    @declared_attr
    def last_modified_time(cls) -> Mapped[str]:
        return mapped_column(DateTime, name="LastModifiedTime", nullable=True)

    @declared_attr
    def last_modified_by(cls) -> Mapped[str]:
        return mapped_column(String(200), name="LastModifiedBy", nullable=True)
