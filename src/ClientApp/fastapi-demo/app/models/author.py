from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base, Auditable


class Author(Base, Auditable):
    __tablename__ = 'authors'
    id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(50), name="firstName", nullable=False)
    last_name = Column(String(50), name="lastName", nullable=False)
    is_active = Column(Boolean, default=True, name="isActive", nullable=False)

    books = relationship("Book", secondary='book_author', back_populates="authors")
