from typing import Optional, List
from pydantic import BaseModel
from src.schemas.author import AuthorDto


class BookDto(BaseModel):
    title: Optional[str] = None
    price: float = 0.0
    isbn: Optional[str] = None
    description: Optional[str] = None
    publishDate: Optional[str] = None
    isActive: Optional[bool] = False
    authors: Optional[List[AuthorDto]] = []


class BookCreateDto(BookDto):
    pass


class BookUpdateDto(BookDto):
    pass
