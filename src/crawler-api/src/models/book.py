from sqlalchemy import Boolean, Column, Integer, String, DECIMAL, Index, ForeignKey
from sqlalchemy.orm import relationship

from src.db.base_class import Base, Auditable


class Book(Base, Auditable):
    __tablename__ = 'books'
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(512), nullable=False)
    price = Column(DECIMAL(18, 2), default=0.00, nullable=False)
    isbn = Column(String(16), nullable=False)
    description = Column(String(2048))
    publish_date = Column(String(10), name="publishDate", default="1900-01-01")
    is_active = Column(Boolean, name="isActive", default=True, nullable=False)
    authors = relationship("Author", secondary='book_author', back_populates="books")


Index('IDX_BOOK_TITLE', Book.title, unique=True)
Index('IDX_BOOK_ISBN', Book.isbn, unique=True)
