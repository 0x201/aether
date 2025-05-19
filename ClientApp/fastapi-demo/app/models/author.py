from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .book import Book  # noqa: F401


class Author(Base):
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(32))
    last_name = Column(String(32))
    full_name = Column(String(64))
    is_active = Column(Boolean, default=True)

    books = relationship("Book", back_populates="author")
