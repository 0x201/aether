from sqlalchemy import Boolean, String, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base_class import Base, Auditable


class Author(Base, Auditable):
    __tablename__ = "Authors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, name="Id")
    first_name: Mapped[str] = mapped_column(String(50), name="FirstName")
    last_name: Mapped[str] = mapped_column(String(50), name="LastName")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, name="IsActive")

    book_authors = relationship(
        "BookAuthor",
        back_populates="author",
    )
    books = relationship(
        "Book",
        secondary="BookAuthor",
        back_populates="authors",
        viewonly=True,
    )


Index("IDX_AUTHOR_NAME", "first_name", "last_name")