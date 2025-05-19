from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps

router = APIRouter()


@router.post("/", response_model=schemas.Author)
async def create_author(
    *, db: Session = Depends(deps.get_db), author_in: schemas.AuthorCreate
):
    author = crud.author.create(db=db, obj_in=author_in)
    return author


@router.get("", response_model=List[schemas.Author])
async def read_authors(
    *,
    db: Session = Depends(deps.get_db),
    search_term: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
):
    return crud.author.get_authors(db, search_term=search_term, skip=skip, limit=limit)


@router.get("/{author_id}", response_model=schemas.Author)
async def get_author(*, db: Session = Depends(deps.get_db), author_id: int):
    return crud.author.get(db, author_id)
