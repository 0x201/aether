from sqlalchemy import Boolean, String, Integer, DECIMAL, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base_class import Base, Auditable


class Book(Base, Auditable):
    __tablename__ = "Books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, name="Id")
    title: Mapped[str] = mapped_column(String(512), name="Title")
    price: Mapped[float] = mapped_column(DECIMAL(18, 2), name="Price")
    isbn: Mapped[str] = mapped_column(String(16), name="Isbn")
    description: Mapped[str] = mapped_column(
        String(2048), name="Description", nullable=True
    )
    publish_date: Mapped[str] = mapped_column(
        String(10), name="PublishDate", nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, name="IsActive")

    book_authors = relationship("BookAuthor", back_populates="book", primaryjoin="Book.id==foreign(BookAuthor.book_id)")


Index("IDX_BOOK_TITLE", "title", unique=True)
Index("IDX_BOOK_ISBN", "isbn", unique=True)
