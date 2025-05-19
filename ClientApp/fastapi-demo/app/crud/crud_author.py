from typing import Optional, Union, Dict

from fastapi import HTTPException

from sqlalchemy import or_
from sqlalchemy.orm import Session
from starlette import status

from app.crud.base import CRUDBase
from app.models.author import Author
from app.schemas.author import AuthorUpdate, AuthorCreate


class CRUDAuthor(CRUDBase[Author, AuthorCreate, AuthorUpdate]):
    def get_author_by_fullname(self, db: Session, full_name: str) -> Optional[Author]:
        return db.query(Author).filter(Author.full_name == full_name).first()

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
        query = db.query(self.model)
        if search_term:
            query = query.filter(
                or_(
                    Author.last_name.like(f"{search_term}"),
                    Author.first_name.like(f"{search_term}"),
                )
            )
        return query.offset(skip).limit(limit).all()


author = CRUDAuthor(Author)
