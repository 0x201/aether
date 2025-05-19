from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from app import crud, schemas
from app.api import deps

router = APIRouter()


@router.get("", response_model=list[schemas.Book])
async def read_books(
    *,
    db: Session = Depends(deps.get_db),
    title: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
) -> Any:
    return crud.book.get_books(db, title=title, skip=skip, limit=limit)


@router.get("/{book_id}", response_model=schemas.Book)
async def get_book(*, db: Session = Depends(deps.get_db), book_id: int):
    return crud.book.get(db, book_id)
 
@router.post("/", response_model=schemas.Book)
async def create_book(*, db: Session = Depends(deps.get_db), book_to_add: schemas.BookCreate):
    return crud.book.create(db, obj_in=book_to_add)

@router.put("/{book_id}", response_model=schemas.Book)
async def update_book(
    *, db: Session = Depends(deps.get_db), book_id: int, book_in: schemas.BookUpdate
) -> Any:
    book = crud.book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The book with this id does not exist in the system.",
        )
    book = crud.book.update(db, db_obj=book, obj_in=book_in)
    return book


@router.patch("/{book_id}", response_model=schemas.Book)
async def patch_book(
    *, db: Session = Depends(deps.get_db), book_id: int, book_in: Dict[str, Any]
) -> Any:
    book = crud.book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The book with this id does not exist in the system.",
        )
    book = crud.book.update(db, db_obj=book, obj_in=book_in)
    return book


@router.delete("/{book_id}")
async def delete_book(*, db: Session = Depends(deps.get_db), book_id: int):
    return crud.book.remove(db, book_id)
