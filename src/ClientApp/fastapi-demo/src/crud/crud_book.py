from typing import Optional

from sqlalchemy.orm import Session, joinedload
from src import models
from src.crud.base import CRUDBase
from src.models.book import Book
from src.schemas.book import BookUpdate, BookCreate


class CRUDBook(CRUDBase[Book, BookCreate, BookUpdate]):
    def get_books(
        self, db: Session, title: Optional[str], skip: int = 0, limit: int = 10
    ) -> list[Book]:
        query = db.query(Book).options(joinedload(Book.authors))
        if title:
            query = query.filter(models.Book.title.like(f"%{title}%"))
        return query.order_by(Book.id).offset(skip).limit(limit).all()

    def get_book_by_title_and_authorid(
        self, db: Session, title: str, author_id: int
    ) -> Book:
        return (
            db.query(models.Book)
            .filter(models.Book.title == title and models.Book.author_id == author_id)
            .first()
        )


book = CRUDBook(Book)