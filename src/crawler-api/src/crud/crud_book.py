from typing import Optional, List

from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import and_, select, func
from src.crud.base import CRUDBase
from src.models.book import Book
from src.models.book_author import BookAuthor
from src.schemas.book import BookUpdateDto, BookCreateDto
from src.schemas.paged_result import PagedResult


class CRUDBook(CRUDBase[Book, BookCreateDto, BookUpdateDto]):
    def get(self, db: Session, id: int) -> Optional[Book]:
        stmt = select(self.model).options(
            joinedload(Book.authors)
        ).where(self.model.id == id)
        result = db.execute(stmt)
        return result.scalars().first()
    
    def get_books(
        self, db: Session, title: Optional[str], skip: int = 0, limit: int = 10
    ) -> PagedResult:
        stmt = select(Book).options(
            joinedload(Book.book_authors)
            .joinedload(BookAuthor.author)
        )
        count_stmt = select(func.count()).select_from(Book)

        if title:
            stmt = stmt.where(Book.title.like(f"%{title}%"))
            count_stmt = count_stmt.where(Book.title.like(f"%{title}%"))

        stmt = stmt.order_by(Book.id).offset(skip).limit(limit)
        result = db.execute(stmt)
        books = result.scalars().unique().all()

        count_result = db.execute(count_stmt)
        total_count = count_result.scalar()

        return PagedResult(items=books, totalCount=total_count)

    def get_book_by_title_and_authorid(
        self, db: Session, title: str, author_id: int
    ) -> Optional[Book]:
        stmt = select(Book).where(
            and_(
                Book.title == title,
                Book.id.in_(
                    select(BookAuthor.book_id).where(BookAuthor.author_id == author_id)
                ),
            )
        )
        result = db.execute(stmt)
        return result.scalars().first()


book = CRUDBook(Book)