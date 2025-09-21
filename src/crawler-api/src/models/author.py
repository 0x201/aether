from sqlalchemy import Boolean, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base_class import Base, Auditable


class Author(Base, Auditable):
    __tablename__ = "Authors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, name="Id")
    first_name: Mapped[str] = mapped_column(String(50), name="FirstName")
    last_name: Mapped[str] = mapped_column(String(50), name="LastName")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, name="IsActive")

    book_authors = relationship("BookAuthor", back_populates="author", primaryjoin="Author.id==foreign(BookAuthor.author_id)")
