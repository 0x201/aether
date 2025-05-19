from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .item import Item  # noqa: F401


class Role(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(32), index=True)
    is_active = Column(Boolean, default=True)

    users = relationship("User", back_populates="role")
