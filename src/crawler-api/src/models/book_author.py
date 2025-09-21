from sqlalchemy import Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base_class import Base


class BookAuthor(Base):
    __tablename__ = "BookAuthor"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, name="Id")
    book_id: Mapped[int] = mapped_column(Integer, name="BookId")
    author_id: Mapped[int] = mapped_column(Integer, name="AuthorId")

    book = relationship("Book", back_populates="book_authors", primaryjoin="foreign(BookAuthor.book_id)==Book.id")
    author = relationship("Author", back_populates="book_authors", primaryjoin="foreign(BookAuthor.author_id)==Author.id")


Index("IDX_BookAuthor_BookId_AuthorId", "book_id", "author_id", unique=True)
