from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from src import crud, schemas
from src.api import deps
from src.schemas.paged_result import PagedResult

router = APIRouter()


@router.get("", response_model=PagedResult[schemas.BookDto])
def read_books(
        *,
        db: Session = Depends(deps.get_db),
        title: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
) -> Any:
    """
    Retrieve books.
    """
    books = crud.book.get_books(db, title=title, skip=skip, limit=limit)
    return books


@router.post("", response_model=schemas.BookDto)
def create_book(
        *,
        db: Session = Depends(deps.get_db),
        book_in: schemas.BookCreateDto,
        current_user=Depends(deps.get_current_user),
) -> Any:
    """
    Create new book.
    """
    current_username = current_user.username if current_user else "system"
    book = crud.book.create(db, obj_in=book_in, current_user=current_username)
    return book


@router.get("/{book_id}", response_model=schemas.BookDto)
def get_book(
        *,
        db: Session = Depends(deps.get_db),
        book_id: int,
) -> Any:
    """
    Get book by ID.
    """
    book = crud.book.get(db, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The book with this id does not exist in the system.",
        )
    return book


@router.put("/{book_id}", response_model=schemas.BookDto)
def update_book(
        *,
        db: Session = Depends(deps.get_db),
        book_id: int,
        book_in: schemas.BookUpdateDto,
        current_user=Depends(deps.get_current_user),
) -> Any:
    """
    Update a book.
    """
    book = crud.book.get(db, id=book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The book with this id does not exist in the system.",
        )
    book = crud.book.update(db, db_obj=book, obj_in=book_in)
    return book


@router.delete("/{book_id}", response_model=schemas.BookDto)
def delete_book(
        *,
        db: Session = Depends(deps.get_db),
        book_id: int,
        current_user=Depends(deps.get_current_user),
) -> Any:
    """
    Delete a book.
    """
    book = crud.book.get(db, id=book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The book with this id does not exist in the system.",
        )
    book = crud.book.remove(db, id=book_id)
    return book