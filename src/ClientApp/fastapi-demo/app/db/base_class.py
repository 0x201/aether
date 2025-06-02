from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Auditable(DeclarativeBase):
    @declared_attr
    def created_by(cls):
        return Column(String(200), name="createdBy", nullable=False)

    @declared_attr
    def created_time(cls):
        return Column(DateTime, name="createdTime", nullable=False, server_default=func.now())

    @declared_attr
    def last_modified_by(cls):
        return Column(String(200), name="lastModifiedBy", nullable=True)

    @declared_attr
    def last_modified_time(cls):
        return Column(DateTime, name="lastModifiedTime", nullable=True, server_default=func.now(), onupdate=func.now())
