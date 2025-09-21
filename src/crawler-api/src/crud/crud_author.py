from typing import Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from starlette import status

from src.crud.base import CRUDBase
from src.models.author import Author
from src.schemas.author import AuthorUpdate, AuthorCreate


class CRUDAuthor(CRUDBase[Author, AuthorCreate, AuthorUpdate]):
    def get(self, db: Session, author_id: int) -> Optional[Author]:
        author = super().get(db, author_id)
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
    ) -> list[Author]:
        query = select(self.model)
        if search_term:
            query = query.filter(
                or_(
                    Author.last_name.like(f"{search_term}"),
                    Author.first_name.like(f"{search_term}"),
                )
            )
        query = query.order_by(self.model.id).offset(skip).limit(limit)
        result = db.execute(query)
        return result.scalars().all()


author = CRUDAuthor(Author)
