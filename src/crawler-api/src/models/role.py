from sqlalchemy import Boolean, String, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base_class import Base, Auditable


class Role(Base, Auditable):
    __tablename__ = "Roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, name="Id")
    name: Mapped[str] = mapped_column(String(200), name="Name")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, name="IsActive")


Index("IDX_ROLE_NAME", "name", unique=True)
