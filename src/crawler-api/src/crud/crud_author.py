from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_, func, select
from starlette import status

from src.crud.base import CRUDBase
from src.models.author import Author
from src.schemas.author import AuthorUpdateDto, AuthorCreateDto
from src.schemas.paged_result import PagedResult


class CRUDAuthor(CRUDBase[Author, AuthorCreateDto, AuthorUpdateDto]):
    def get(self, db: Session, author_id: int) -> Optional[Author]:
        stmt = select(self.model).where(self.model.id == author_id)
        result = db.execute(stmt)
        author = result.scalars().first()
        if not author:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not find the author with id: {author_id}.",
            )
        return author

    def get_authors(
        self,
        db: Session,
        *,
        search_term: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> PagedResult:
        stmt = select(self.model)
        count_stmt = select(func.count()).select_from(self.model)

        if search_term:
            stmt = stmt.where(
                or_(
                    Author.last_name.like(f"%{search_term}%"),
                    Author.first_name.like(f"%{search_term}%"),
                )
            )
            count_stmt = count_stmt.where(
                or_(
                    Author.last_name.like(f"%{search_term}%"),
                    Author.first_name.like(f"%{search_term}%"),
                )
            )

        stmt = stmt.order_by(self.model.id).offset(skip).limit(limit)
        result = db.execute(stmt)
        authors = result.scalars().unique().all()

        count_result = db.execute(count_stmt)
        total_count = count_result.scalar()

        return PagedResult(items=authors, totalCount=total_count)


author = CRUDAuthor(Author)