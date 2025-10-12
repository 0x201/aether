from sqlalchemy import Integer, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base_class import Base


class BookAuthor(Base):
    __tablename__ = "BookAuthor"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, name="Id")
    book_id: Mapped[int] = mapped_column(Integer, ForeignKey("Books.Id"), name="BookId")
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("Authors.Id"), name="AuthorId")

    book = relationship("Book", back_populates="book_authors")
    author = relationship("Author", back_populates="book_authors")


Index("IDX_BookAuthor_BookId_AuthorId", "book_id", "author_id", unique=True)