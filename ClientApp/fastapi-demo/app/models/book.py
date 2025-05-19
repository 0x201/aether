from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DECIMAL
from sqlalchemy.orm import relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .author import Author  # noqa: F401


class Book(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), unique=True, index=True)
    price = Column(DECIMAL(18, 2), default=0.00)
    isbn = Column(String(13), index=True)
    description = Column(String(2048))
    language = Column(String(50), index=True)
    paperback = Column(Integer, default=0)
    publish_date = Column(String(10), default="1900-01-01")
    cover_img = Column(String(256))
    is_active = Column(Boolean, default=True)
    author_id = Column(Integer, ForeignKey("authors.id"))

    author = relationship("Author", back_populates="books")
