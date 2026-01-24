from datetime import datetime

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from .base import Base


class EGameAudit(Base):
    __tablename__ = "egame_audits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256))
    publisher: Mapped[str] = mapped_column(String(512))
    audit_no: Mapped[str] = mapped_column(String(128))
    publish_date: Mapped[datetime] = mapped_column(DateTime)


class GameAlterationAudit(Base):
    __tablename__ = "game_alteration_audits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256))
    audit_category: Mapped[str] = mapped_column(String(128))
    publisher: Mapped[str] = mapped_column(String(512))
    operator: Mapped[str] = mapped_column(String(512))
    alteration_msg: Mapped[str] = mapped_column(String(2048))
    audit_no: Mapped[str] = mapped_column(String(128))
    alter_date: Mapped[datetime] = mapped_column(DateTime)


class GameAudit(Base):
    __tablename__ = "game_audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(512), unique=True)
    url: Mapped[str] = mapped_column(String(512), unique=True)
    publish_date: Mapped[datetime] = mapped_column(DateTime)


class GameRevocationAudit(Base):
    __tablename__ = "revocation_audits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256))
    audit_category: Mapped[str] = mapped_column(String(128))
    publisher: Mapped[str] = mapped_column(String(512))
    operator: Mapped[str] = mapped_column(String(512))
    revocation_msg: Mapped[str] = mapped_column(String(2048))
    audit_no: Mapped[str] = mapped_column(String(128))
    isbn: Mapped[str] = mapped_column(String(128))
    approval_date: Mapped[datetime] = mapped_column(DateTime)


class NetworkGameAudit(Base):
    __tablename__ = "network_game_audits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256))
    audit_category: Mapped[str] = mapped_column(String(128))
    publisher: Mapped[str] = mapped_column(String(512))
    operator: Mapped[str] = mapped_column(String(512))
    audit_no: Mapped[str] = mapped_column(String(128))
    isbn: Mapped[str] = mapped_column(String(128))
    category: Mapped[int] = mapped_column(Integer)  # 1 国产 2 进口
    publish_date: Mapped[datetime] = mapped_column(DateTime)
